# Feature: costops-enhancements, Property 5: JWT login returns token with correct payload
# Feature: costops-enhancements, Property 6: Protected endpoint auth enforcement

"""
Property-based tests for JWT authentication.

Property 5: For any valid user_id (int) and role (str), create_access_token
produces a JWT whose decoded payload contains matching sub and role fields.
**Validates: Requirements 5.1, 5.3**

Property 6: For any invalid or expired JWT token, get_current_user raises
HTTPException with status 401.
**Validates: Requirements 4.3, 5.4, 7.3**
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from fastapi import HTTPException
from jose import jwt

# Ensure the app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.auth import (
    create_access_token,
    get_current_user,
    JWT_SECRET,
    JWT_ALGORITHM,
)


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# user_id: positive integers (realistic DB primary keys)
user_ids = st.integers(min_value=1, max_value=10**9)

# role: non-empty printable text (e.g. "user", "admin", random strings)
roles = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "P")),
    min_size=1,
    max_size=50,
)

# Random strings for invalid tokens — may include any printable chars
invalid_token_strings = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "P", "S")),
    min_size=1,
    max_size=200,
)


# ---------------------------------------------------------------------------
# Property 5: JWT login returns token with correct payload
# **Validates: Requirements 5.1, 5.3**
# ---------------------------------------------------------------------------


class TestProperty5JWTPayload:
    """Property 5: JWT login returns token with correct payload."""

    @given(user_id=user_ids, role=roles)
    @settings(max_examples=10)
    def test_token_contains_correct_sub_and_role(self, user_id: int, role: str):
        """
        For any valid user_id and role, the JWT produced by
        create_access_token decodes to a payload where
        sub == str(user_id) and role == role.
        """
        token = create_access_token(user_id, role)

        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        assert payload["sub"] == str(user_id), (
            f"Expected sub={user_id!r}, got {payload['sub']!r}"
        )
        assert payload["role"] == role, (
            f"Expected role={role!r}, got {payload['role']!r}"
        )

    @given(user_id=user_ids, role=roles)
    @settings(max_examples=10)
    def test_token_has_future_expiry(self, user_id: int, role: str):
        """
        The token's exp claim should be in the future (within ~24 h).
        """
        token = create_access_token(user_id, role)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)

        assert exp > now, "Token expiry should be in the future"
        # Should be roughly 24 h from now (allow 1-minute tolerance)
        assert exp <= now + timedelta(hours=24, minutes=1)


# ---------------------------------------------------------------------------
# Property 6: Protected endpoint auth enforcement
# **Validates: Requirements 4.3, 5.4, 7.3**
# ---------------------------------------------------------------------------


class TestProperty6AuthEnforcement:
    """Property 6: Protected endpoint auth enforcement.

    Any invalid or expired token must cause get_current_user to raise
    HTTPException(401).
    """

    @given(token=invalid_token_strings)
    @settings(max_examples=10)
    def test_random_invalid_tokens_rejected(self, token: str):
        """Random strings that are not valid JWTs must be rejected with 401."""
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401

    @given(user_id=user_ids, role=roles)
    @settings(max_examples=10)
    def test_expired_tokens_rejected(self, user_id: int, role: str):
        """Tokens with an expiry in the past must be rejected with 401."""
        expired_payload = {
            "sub": str(user_id),
            "role": role,
            "exp": datetime.now(timezone.utc) - timedelta(seconds=10),
        }
        token = jwt.encode(expired_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401

    @given(user_id=user_ids)
    @settings(max_examples=10)
    def test_token_missing_role_rejected(self, user_id: int):
        """A token with sub but no role must be rejected with 401."""
        payload = {
            "sub": str(user_id),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401

    @given(role=roles)
    @settings(max_examples=10)
    def test_token_missing_sub_rejected(self, role: str):
        """A token with role but no sub must be rejected with 401."""
        payload = {
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401

    def test_token_signed_with_wrong_secret_rejected(self):
        """A token signed with a different secret must be rejected with 401."""
        payload = {
            "sub": "42",
            "role": "user",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, "wrong-secret-key", algorithm=JWT_ALGORITHM)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401
