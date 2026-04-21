# Feature: costops-enhancements, Property 1: Provider routing correctness
# Feature: costops-enhancements, Property 3: Unsupported service rejection with supported list

"""
Property-based tests for multi-cloud cost calculation routing.

Property 1: Valid (provider, service) combos route to the correct provider module.
  **Validates: Requirements 1.1, 1.4**

Property 3: Invalid service for a valid provider returns 400 with supported services list.
  **Validates: Requirements 1.5**
"""

from unittest.mock import patch

from hypothesis import given, settings, assume
from hypothesis import strategies as st

from tests.conftest import client

# ---------------------------------------------------------------------------
# Valid provider -> services mapping
# ---------------------------------------------------------------------------

PROVIDER_SERVICES = {
    "aws": ["ec2", "s3", "lambda"],
    "azure": ["virtual_machines", "blob_storage", "functions"],
    "gcp": ["compute_engine", "cloud_storage", "cloud_functions"],
}

ALL_VALID_SERVICES = set()
for svc_list in PROVIDER_SERVICES.values():
    ALL_VALID_SERVICES.update(svc_list)

# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

provider_service_pairs = st.sampled_from([
    (provider, service)
    for provider, services in PROVIDER_SERVICES.items()
    for service in services
])

valid_providers = st.sampled_from(["aws", "azure", "gcp"])

invalid_service_names = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Pd")),
    min_size=1,
    max_size=40,
).filter(lambda s: s.lower() not in ALL_VALID_SERVICES and s.strip())


# ---------------------------------------------------------------------------
# Property 1: Provider routing correctness
# ---------------------------------------------------------------------------

MOCK_RESULT = {
    "cost": 42.0,
    "currency": "USD",
    "details": {"mocked": True},
    "recommendation": "Use reserved instances.",
}

# Map provider -> fully-qualified function path to mock
PROVIDER_CALC_PATHS = {
    "aws": "app.main.calculate_aws_cost",
    "azure": "app.main.calculate_azure_cost",
    "gcp": "app.main.calculate_gcp_cost",
}


class TestProperty1ProviderRoutingCorrectness:

    @given(pair=provider_service_pairs)
    @settings(max_examples=10)
    def test_valid_provider_service_routes_correctly(self, pair):
        provider, service = pair
        mock_path = PROVIDER_CALC_PATHS[provider]

        with patch(mock_path, return_value=dict(MOCK_RESULT)) as mocked_fn:
            resp = client.post("/api/calculate-cost", json={
                "cloud_provider": provider,
                "service": service,
                "parameters": {},
            })

        # The mocked function should have been called exactly once
        mocked_fn.assert_called_once()
        # The first positional arg should be the service name
        call_args = mocked_fn.call_args
        assert call_args[0][0] == service
        # Response should be 200 with our mock result
        assert resp.status_code == 200
        data = resp.json()
        assert data["cost"] == 42.0


# ---------------------------------------------------------------------------
# Property 3: Unsupported service rejection with supported list
# ---------------------------------------------------------------------------

class TestProperty3UnsupportedServiceRejection:

    @given(provider=valid_providers, bad_service=invalid_service_names)
    @settings(max_examples=10)
    def test_invalid_service_returns_400_with_supported_list(self, provider, bad_service):
        resp = client.post("/api/calculate-cost", json={
            "cloud_provider": provider,
            "service": bad_service,
            "parameters": {},
        })
        assert resp.status_code == 400

        detail = resp.json()["detail"]
        # The error message should mention the bad service
        assert bad_service in detail
        # The error message should list the supported services for this provider
        for supported_svc in PROVIDER_SERVICES[provider]:
            assert supported_svc in detail, (
                f"Expected '{supported_svc}' in error detail for provider '{provider}', "
                f"got: {detail}"
            )
