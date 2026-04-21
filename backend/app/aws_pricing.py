"""AWS pricing logic — fetches rates from AI or native API, caches in DB."""

import json
import re
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.ai import call_ai
from app.db_models import PricingRate
from app.pricing_config import get_pricing_source


def _parse_ai_json(text: str) -> dict | None:
    """Extract JSON from AI response that may contain markdown fences or extra text."""
    text = text.strip()

    # Try to find JSON between code fences
    fence_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Try to find a JSON object in the text
    brace_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if brace_match:
        text = brace_match.group(0)

    try:
        data = json.loads(text)
        # Ensure all values are floats
        return {k: float(v) for k, v in data.items() if _is_numeric(v)}
    except (json.JSONDecodeError, ValueError, TypeError):
        return None


def _is_numeric(v) -> bool:
    try:
        float(v)
        return True
    except (ValueError, TypeError):
        return False


def _extract_rate(rates: dict, *keys) -> float:
    """Try multiple key names, return first non-zero float found."""
    for key in keys:
        val = rates.get(key)
        if val is not None and float(val) > 0:
            return float(val)
    # Fallback: return the first positive numeric value in the dict
    for val in rates.values():
        try:
            f = float(val)
            if f > 0:
                return f
        except (ValueError, TypeError):
            continue
    return 0.0


def _fetch_rate_from_ai(service: str, resource_type: str, region: str) -> dict | None:
    """Ask AI for current pricing and parse the JSON response."""
    if service == "ec2":
        format_hint = '{"hourly_rate_linux": 0.0116, "hourly_rate_windows": 0.0162}'
    elif service == "s3":
        format_hint = '{"per_gb_month": 0.023, "request_per_1000_get": 0.0004, "request_per_1000_put": 0.005}'
    elif service == "lambda":
        format_hint = '{"per_request": 0.0000002, "per_gb_second": 0.0000166667}'
    else:
        format_hint = '{}'

    prompt = f"""Return ONLY a JSON object with AWS pricing. No text, no explanation, no markdown.

Service: {service.upper()}
Resource: {resource_type}
Region: {region}

Exact format: {format_hint}

Replace the example values with actual current AWS pricing. Return ONLY the JSON."""

    response = call_ai(prompt)
    if not response or "Error" in response[:20]:
        return None

    parsed = _parse_ai_json(response)
    if not parsed:
        return None

    # Validate that at least one value is > 0
    has_positive = any(float(v) > 0 for v in parsed.values() if _is_numeric(v))
    if not has_positive:
        return None

    return parsed


def _fetch_rate_from_api(service: str, resource_type: str, region: str) -> dict | None:
    """Fetch pricing from AWS Cost Explorer API (placeholder/stub).

    TODO: Implement actual AWS Cost Explorer / Pricing API integration.
    Currently returns hardcoded reasonable defaults for supported services.
    """
    # Placeholder rates based on typical AWS pricing
    stub_rates = {
        "ec2": {"hourly_rate_linux": 0.0116, "hourly_rate_windows": 0.0162},
        "s3": {"per_gb_month": 0.023, "request_per_1000_get": 0.0004, "request_per_1000_put": 0.005},
        "lambda": {"per_request": 0.0000002, "per_gb_second": 0.0000166667},
    }
    return stub_rates.get(service)


def get_rate(db: Session, service: str, resource_type: str, region: str) -> dict | None:
    """Get rate from DB, or fetch from AI/API depending on pricing source config."""
    rate = db.query(PricingRate).filter(
        PricingRate.service == service,
        PricingRate.resource_type == resource_type,
        PricingRate.region == region,
    ).order_by(PricingRate.fetched_at.desc()).first()

    if rate and rate.rates:
        # Validate stored rate has positive values
        has_positive = any(float(v) > 0 for v in rate.rates.values() if _is_numeric(v))
        if has_positive:
            return rate.rates
        # Bad cached rate — delete it and re-fetch
        db.delete(rate)
        db.commit()

    # Fetch based on configured pricing source
    source = get_pricing_source()
    if source == "api":
        rates = _fetch_rate_from_api(service, resource_type, region)
    else:
        rates = _fetch_rate_from_ai(service, resource_type, region)

    if not rates:
        return None

    db.add(PricingRate(
        service=service,
        resource_type=resource_type,
        region=region,
        rates=rates,
        source=source,
    ))
    db.commit()
    return rates


def get_recommendation(service: str, params: dict, cost: float) -> str:
    """Get a brief AI recommendation for the calculated cost."""
    prompt = f"""You are an AWS cost optimization expert. Be concise — max 3 short sentences.

Service: {service.upper()}
Parameters: {json.dumps(params)}
Estimated monthly cost: ${cost:.2f}

Give a brief cost optimization tip for this specific configuration.
Mention cheaper alternatives if applicable. Be specific, not generic."""

    return call_ai(prompt)


def calculate_ec2(params: dict, db: Session) -> dict:
    instance_type = params.get("instance_type", "t2.micro")
    region = params.get("region", "us-east-1")
    hours = params.get("hours", 720)
    os_type = params.get("operating_system", "linux").lower()

    rates = get_rate(db, "ec2", instance_type, region)
    if not rates:
        return {"error": f"Could not fetch pricing for EC2 {instance_type} in {region}. AI may be unavailable."}

    hourly_rate = _extract_rate(rates, f"hourly_rate_{os_type}", "hourly_rate_linux", "hourly_rate")
    if hourly_rate == 0:
        return {"error": f"Got zero rate for EC2 {instance_type}. Raw rates: {json.dumps(rates)}"}

    total = round(hourly_rate * hours, 2)

    return {
        "cost": total,
        "currency": "USD",
        "details": {
            "instance_type": instance_type,
            "region": region,
            "operating_system": os_type,
            "hourly_rate": hourly_rate,
            "total_hours": hours,
        }
    }


def calculate_s3(params: dict, db: Session) -> dict:
    storage_gb = params.get("storage_gb", 100)
    region = params.get("region", "us-east-1")
    access_frequency = params.get("access_frequency", "frequent").lower()

    rates = get_rate(db, "s3", "standard", region)
    if not rates:
        return {"error": f"Could not fetch pricing for S3 in {region}. AI may be unavailable."}

    gb_rate = _extract_rate(rates, "per_gb_month")
    storage_cost = round(storage_gb * gb_rate, 2)

    freq_multiplier = {"frequent": 10, "infrequent": 2, "rare": 0.5}
    estimated_gets = int(storage_gb * 1000 * freq_multiplier.get(access_frequency, 1))
    get_rate_per_1k = _extract_rate(rates, "request_per_1000_get")
    request_cost = round((estimated_gets / 1000) * get_rate_per_1k, 2)

    total = round(storage_cost + request_cost, 2)

    return {
        "cost": total,
        "currency": "USD",
        "details": {
            "storage_gb": storage_gb,
            "region": region,
            "access_frequency": access_frequency,
            "storage_cost_monthly": storage_cost,
            "request_cost_monthly": request_cost,
        }
    }


def calculate_lambda(params: dict, db: Session) -> dict:
    requests_count = params.get("requests", 1_000_000)
    duration_ms = params.get("duration_ms", 200)
    memory_mb = params.get("memory_mb", 128)
    region = params.get("region", "us-east-1")

    rates = get_rate(db, "lambda", "invocation", region)
    if not rates:
        return {"error": f"Could not fetch pricing for Lambda in {region}. AI may be unavailable."}

    per_request = _extract_rate(rates, "per_request")
    per_gb_second = _extract_rate(rates, "per_gb_second")

    request_cost = round(requests_count * per_request, 4)

    memory_gb = memory_mb / 1024
    duration_sec = duration_ms / 1000
    gb_seconds = requests_count * memory_gb * duration_sec
    compute_cost = round(gb_seconds * per_gb_second, 4)

    total = round(request_cost + compute_cost, 2)

    return {
        "cost": total,
        "currency": "USD",
        "details": {
            "requests": requests_count,
            "duration_ms": duration_ms,
            "memory_mb": memory_mb,
            "region": region,
            "request_cost": request_cost,
            "compute_cost": compute_cost,
        }
    }


def calculate_aws_cost(service: str, params: dict, db: Session) -> dict:
    calculators = {
        "ec2": calculate_ec2,
        "s3": calculate_s3,
        "lambda": calculate_lambda,
    }

    calc = calculators.get(service.lower())
    if not calc:
        return {"error": f"Unsupported service: {service}. Supported: ec2, s3, lambda"}

    result = calc(params, db)

    if "error" not in result:
        result["recommendation"] = get_recommendation(service, params, result["cost"])

    return result
