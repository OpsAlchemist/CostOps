# Feature: costops-enhancements, Property 10: Credential encryption round-trip
# Feature: costops-enhancements, Property 11: Credential upsert overwrites previous value
# Feature: costops-enhancements, Property 2: Invalid cloud provider rejection

"""
Property-based tests for credential storage and cloud provider validation.

Property 10: Encrypt/store/retrieve/decrypt round-trip for credentials.
Property 11: Upsert keeps single row with latest value.
Property 2: Invalid cloud provider returns HTTP 400.
"""

import json

from hypothesis import given, settings, assume
from hypothesis import strategies as st

from tests.conftest import (
    client, TestSessionLocal, make_user, auth_header, clear_tables,
)
from app.db_models import UserCloudCredential
from app.crypto import decrypt_credential

SUPPORTED_PROVIDERS = {"aws", "azure", "gcp"}

# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

credential_strings = st.text(
    alphabet=st.characters(
        whitelist_categories=("L", "N", "P", "S"),
        blacklist_characters=("\x00",),
    ),
    min_size=1, max_size=100,
).filter(lambda s: s.strip())

valid_providers = st.sampled_from(["aws", "azure", "gcp"])

invalid_providers = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N")),
    min_size=1, max_size=30,
).filter(lambda s: s.lower() not in SUPPORTED_PROVIDERS and s.strip())


# ---------------------------------------------------------------------------
# Property 10: Credential encryption round-trip
# ---------------------------------------------------------------------------

class TestProperty10CredentialEncryptionRoundTrip:

    @given(access_key=credential_strings, secret_key=credential_strings, provider=valid_providers)
    @settings(max_examples=10)
    def test_encrypt_store_retrieve_decrypt_roundtrip(self, access_key, secret_key, provider):
        clear_tables("user_cloud_credentials", "users")
        db = TestSessionLocal()
        try:
            user = make_user(db, username="cred_user", email="cred@test.com")
            headers = auth_header(user)
            user_id = user.id
        finally:
            db.close()

        payload = {
            "cloud_provider": provider,
            "access_key_id": access_key,
            "secret_access_key": secret_key,
        }
        resp = client.post("/api/user/connect-cloud", json=payload, headers=headers)
        assert resp.status_code == 200, f"POST failed: {resp.text}"

        db2 = TestSessionLocal()
        try:
            cred = db2.query(UserCloudCredential).filter(
                UserCloudCredential.user_id == user_id,
                UserCloudCredential.cloud_provider == provider,
            ).first()
            assert cred is not None
            decrypted = json.loads(decrypt_credential(cred.encrypted_key))
            assert decrypted["access_key_id"] == access_key
            assert decrypted["secret_access_key"] == secret_key
        finally:
            db2.close()


# ---------------------------------------------------------------------------
# Property 11: Credential upsert overwrites previous value
# ---------------------------------------------------------------------------

class TestProperty11CredentialUpsert:

    @given(
        access_key_1=credential_strings, secret_key_1=credential_strings,
        access_key_2=credential_strings, secret_key_2=credential_strings,
        provider=valid_providers,
    )
    @settings(max_examples=10)
    def test_upsert_keeps_single_row_with_latest_value(
        self, access_key_1, secret_key_1, access_key_2, secret_key_2, provider
    ):
        clear_tables("user_cloud_credentials", "users")
        db = TestSessionLocal()
        try:
            user = make_user(db, username="upsert_user", email="upsert@test.com")
            headers = auth_header(user)
            user_id = user.id
        finally:
            db.close()

        for ak, sk in [(access_key_1, secret_key_1), (access_key_2, secret_key_2)]:
            resp = client.post("/api/user/connect-cloud", json={
                "cloud_provider": provider,
                "access_key_id": ak,
                "secret_access_key": sk,
            }, headers=headers)
            assert resp.status_code == 200

        db2 = TestSessionLocal()
        try:
            rows = db2.query(UserCloudCredential).filter(
                UserCloudCredential.user_id == user_id,
                UserCloudCredential.cloud_provider == provider,
            ).all()
            assert len(rows) == 1
            decrypted = json.loads(decrypt_credential(rows[0].encrypted_key))
            assert decrypted["access_key_id"] == access_key_2
            assert decrypted["secret_access_key"] == secret_key_2
        finally:
            db2.close()


# ---------------------------------------------------------------------------
# Property 2: Invalid cloud provider rejection
# ---------------------------------------------------------------------------

class TestProperty2InvalidCloudProviderRejection:

    @given(bad_provider=invalid_providers)
    @settings(max_examples=10)
    def test_connect_cloud_rejects_invalid_provider(self, bad_provider):
        clear_tables("user_cloud_credentials", "users")
        db = TestSessionLocal()
        try:
            user = make_user(db, username="invalid_prov_user", email="invalid_prov@test.com")
            headers = auth_header(user)
        finally:
            db.close()

        resp = client.post("/api/user/connect-cloud", json={
            "cloud_provider": bad_provider,
            "access_key_id": "AKIAIOSFODNN7EXAMPLE",
            "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        }, headers=headers)
        assert resp.status_code == 400

    @given(bad_provider=invalid_providers)
    @settings(max_examples=10)
    def test_calculate_cost_rejects_invalid_provider(self, bad_provider):
        resp = client.post("/api/calculate-cost", json={
            "cloud_provider": bad_provider,
            "service": "ec2",
            "parameters": {"instance_type": "t2.micro", "region": "us-east-1"},
        })
        assert resp.status_code == 400
