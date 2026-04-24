"""OAuth ID token verification for Google and Apple."""

import os
import logging
import requests

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "")


def verify_google_token(id_token: str) -> dict | None:
    """Verify a Google ID token via Google's tokeninfo endpoint.
    Returns {email, name, sub} or None on failure."""
    try:
        res = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
            timeout=10,
        )
        if res.status_code != 200:
            logger.warning("Google token verification failed: %s", res.text)
            return None
        data = res.json()

        # Verify audience matches our client ID (if configured)
        if GOOGLE_CLIENT_ID and data.get("aud") != GOOGLE_CLIENT_ID:
            logger.warning("Google token audience mismatch: %s", data.get("aud"))
            return None

        # Verify email is verified
        if data.get("email_verified") != "true" and data.get("email_verified") is not True:
            logger.warning("Google email not verified")
            return None

        return {
            "email": data.get("email"),
            "name": data.get("name", data.get("email", "").split("@")[0]),
            "sub": data.get("sub"),
        }
    except Exception as e:
        logger.error("Google token verification error: %s", e)
        return None


def verify_apple_token(id_token: str) -> dict | None:
    """Verify an Apple ID token by decoding (Apple uses JWT with rotating keys).
    For production, fetch Apple's public keys from https://appleid.apple.com/auth/keys
    Returns {email, name, sub} or None on failure."""
    try:
        from jose import jwt

        # Decode without verification first to get the header
        unverified_claims = jwt.get_unverified_claims(id_token)

        # Fetch Apple's public keys
        keys_res = requests.get("https://appleid.apple.com/auth/keys", timeout=10)
        if keys_res.status_code != 200:
            return None

        jwks = keys_res.json()
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")

        # Find the matching key
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if not key:
            logger.warning("Apple key not found for kid: %s", kid)
            return None

        # Verify signature and claims
        claims = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=APPLE_CLIENT_ID if APPLE_CLIENT_ID else None,
            options={"verify_aud": bool(APPLE_CLIENT_ID)},
        )

        return {
            "email": claims.get("email"),
            "name": claims.get("email", "").split("@")[0],
            "sub": claims.get("sub"),
        }
    except Exception as e:
        logger.error("Apple token verification error: %s", e)
        return None


def verify_oauth_token(provider: str, id_token: str) -> dict | None:
    """Verify an OAuth ID token and return user info."""
    if provider == "google":
        return verify_google_token(id_token)
    elif provider == "apple":
        return verify_apple_token(id_token)
    return None
