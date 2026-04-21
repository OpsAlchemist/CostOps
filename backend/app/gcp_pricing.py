"""GCP pricing logic — fetches rates from AI or native API, caches in DB."""

import json
from sqlalchemy.orm import Session
from app.ai import call_ai
from app.db_models import PricingRate
from app.aws_pricing import _parse_ai_json, _is_numeric, _extract_rate
from app.pricing_config import get_pricing_source


def _fetch_rate_from_ai(service: str, resource_type: str, region: str) -> dict | None:
    """Ask AI for current GCP pricing and parse the JSON response."""
    if service == "compute_engine":
        format_hint = '{"hourly_rate_linux": 0.0104, "hourly_rate_windows": 0.0156}'
    elif service == "cloud_storage":
        format_hint = '{"per_gb_month": 0.020, "request_per_10000_class_a": 0.05, "request_per_10000_class_b": 0.004}'
    elif service == "cloud_functions":
        format_hint = '{"per_invocation": 0.0000004, "per_gb_second": 0.0000025}'
    else:
        format_hint = '{}'

    prompt = f"""Return ONLY a JSON object with GCP pricing. No text, no explanation, no markdown.

Service: Google Cloud {service.replace('_', ' ').title()}
Resource: {resource_type}
Region: {region}

Exact format: {format_hint}

Replace the example values with actual current GCP pricing. Return ONLY the JSON."""

    response = call_ai(prompt)
    if not response or "Error" in response[:20]:
        return None

    parsed = _parse_ai_json(response)
    if not parsed:
        return None

    has_positive = any(float(v) > 0 for v in parsed.values() if _is_numeric(v))
    if not has_positive:
        return None

    return parsed


def _fetch_rate_from_api(service: str, resource_type: str, region: str) -> dict | None:
    """Fetch pricing from GCP Cloud Billing API (placeholder/stub).

    TODO: Implement actual GCP Cloud Billing / Pricing API integration.
    Currently returns hardcoded reasonable defaults for supported services.
    """
    stub_rates = {
        "compute_engine": {"hourly_rate_linux": 0.0104, "hourly_rate_windows": 0.0156},
        "cloud_storage": {"per_gb_month": 0.020, "request_per_10000_class_a": 0.05, "request_per_10000_class_b": 0.004},
        "cloud_functions": {"per_invocation": 0.0000004, "per_gb_second": 0.0000025},
    }
    return stub_rates.get(service)


def get_rate(db: Session, service: str, resource_type: str, region: str) -> dict | None:
    """Get rate from DB, or fetch from AI/API depending on pricing source config."""
    rate = db.query(PricingRate).filter(
        PricingRate.service == f"gcp_{service}",
        PricingRate.resource_type == resource_type,
        PricingRate.region == region,
    ).order_by(PricingRate.fetched_at.desc()).first()

    if rate and rate.rates:
        has_positive = any(float(v) > 0 for v in rate.rates.values() if _is_numeric(v))
        if has_positive:
            return rate.rates
        db.delete(rate)
        db.commit()

    source = get_pricing_source()
    if source == "api":
        rates = _fetch_rate_from_api(service, resource_type, region)
    else:
        rates = _fetch_rate_from_ai(service, resource_type, region)

    if not rates:
        return None

    db.add(PricingRate(
        service=f"gcp_{service}",
        resource_type=resource_type,
        region=region,
        rates=rates,
        source=source,
    ))
    db.commit()
    return rates


def get_recommendation(service: str, params: dict, cost: float) -> str:
    """Get a brief AI recommendation for the calculated GCP cost."""
    prompt = f"""You are a GCP cost optimization expert. Be concise — max 3 short sentences.

Service: Google Cloud {service.replace('_', ' ').title()}
Parameters: {json.dumps(params)}
Estimated monthly cost: ${cost:.2f}

Give a brief cost optimization tip for this specific configuration.
Mention cheaper alternatives if applicable. Be specific, not generic."""

    return call_ai(prompt)


def calculate_compute_engine(params: dict, db: Session) -> dict:
    machine_type = params.get("machine_type", "e2-micro")
    region = params.get("region", "us-central1")
    hours = params.get("hours", 720)
    os_type = params.get("operating_system", "linux").lower()

    rates = get_rate(db, "compute_engine", machine_type, region)
    if not rates:
        return {"error": f"Could not fetch pricing for GCP Compute Engine {machine_type} in {region}. AI may be unavailable."}

    hourly_rate = _extract_rate(rates, f"hourly_rate_{os_type}", "hourly_rate_linux", "hourly_rate")
    if hourly_rate == 0:
        return {"error": f"Got zero rate for GCP Compute Engine {machine_type}. Raw rates: {json.dumps(rates)}"}

    total = round(hourly_rate * hours, 2)

    return {
        "cost": total,
        "currency": "USD",
        "details": {
            "machine_type": machine_type,
            "region": region,
            "operating_system": os_type,
            "hourly_rate": hourly_rate,
            "total_hours": hours,
        }
    }


def calculate_cloud_storage(params: dict, db: Session) -> dict:
    storage_gb = params.get("storage_gb", 100)
    region = params.get("region", "us-central1")
    access_frequency = params.get("access_frequency", "frequent").lower()

    rates = get_rate(db, "cloud_storage", "standard", region)
    if not rates:
        return {"error": f"Could not fetch pricing for GCP Cloud Storage in {region}. AI may be unavailable."}

    gb_rate = _extract_rate(rates, "per_gb_month")
    storage_cost = round(storage_gb * gb_rate, 2)

    freq_multiplier = {"frequent": 10, "infrequent": 2, "rare": 0.5}
    estimated_ops = int(storage_gb * 1000 * freq_multiplier.get(access_frequency, 1))
    class_b_rate_per_10k = _extract_rate(rates, "request_per_10000_class_b")
    request_cost = round((estimated_ops / 10000) * class_b_rate_per_10k, 2)

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


def calculate_cloud_functions(params: dict, db: Session) -> dict:
    invocations = params.get("invocations", 1_000_000)
    duration_ms = params.get("duration_ms", 200)
    memory_mb = params.get("memory_mb", 256)
    region = params.get("region", "us-central1")

    rates = get_rate(db, "cloud_functions", "invocation", region)
    if not rates:
        return {"error": f"Could not fetch pricing for GCP Cloud Functions in {region}. AI may be unavailable."}

    per_invocation = _extract_rate(rates, "per_invocation", "per_request")
    per_gb_second = _extract_rate(rates, "per_gb_second")

    invocation_cost = round(invocations * per_invocation, 4)

    memory_gb = memory_mb / 1024
    duration_sec = duration_ms / 1000
    gb_seconds = invocations * memory_gb * duration_sec
    compute_cost = round(gb_seconds * per_gb_second, 4)

    total = round(invocation_cost + compute_cost, 2)

    return {
        "cost": total,
        "currency": "USD",
        "details": {
            "invocations": invocations,
            "duration_ms": duration_ms,
            "memory_mb": memory_mb,
            "region": region,
            "invocation_cost": invocation_cost,
            "compute_cost": compute_cost,
        }
    }


def calculate_gcp_cost(service: str, params: dict, db: Session) -> dict:
    calculators = {
        "compute_engine": calculate_compute_engine,
        "cloud_storage": calculate_cloud_storage,
        "cloud_functions": calculate_cloud_functions,
    }

    calc = calculators.get(service.lower())
    if not calc:
        return {"error": f"Unsupported service: {service} for gcp. Supported: compute_engine, cloud_storage, cloud_functions"}

    result = calc(params, db)

    if "error" not in result:
        result["recommendation"] = get_recommendation(service, params, result["cost"])

    return result
