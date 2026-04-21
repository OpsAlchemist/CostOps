# Feature: costops-enhancements, Property 7: Profile update round-trip
# Feature: costops-enhancements, Property 8: Duplicate email rejection
# Feature: costops-enhancements, Property 9: Invalid email format rejection

"""
Property-based tests for user profile management.

Property 7: PUT then GET on /api/user/profile returns the same values.
Property 8: Duplicate email update returns HTTP 409.
Property 9: Invalid email format returns HTTP 422.
"""

from hypothesis import given, settings, assume
from hypothesis import strategies as st

from tests.conftest import (
    client, TestSessionLocal, make_user, auth_header, clear_tables,
)

# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

names = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Zs")),
    min_size=1, max_size=80,
).filter(lambda s: s.strip())

companies = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Zs")),
    min_size=1, max_size=80,
).filter(lambda s: s.strip())

bios = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Zs", "P")),
    min_size=0, max_size=200,
)

_local_part = st.from_regex(r"[a-z][a-z0-9]{0,15}", fullmatch=True)
_domain_part = st.from_regex(r"[a-z]{2,10}", fullmatch=True)
_tld = st.sampled_from(["com", "org", "net", "io", "dev"])
valid_emails = st.builds(
    lambda local, domain, tld: f"{local}@{domain}.{tld}",
    _local_part, _domain_part, _tld,
)

invalid_emails = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N")),
    min_size=1, max_size=60,
).filter(lambda s: "@" not in s and "." not in s)


# ---------------------------------------------------------------------------
# Property 7: Profile update round-trip
# ---------------------------------------------------------------------------

class TestProperty7ProfileRoundTrip:

    @given(name=names, company=companies, email=valid_emails, bio=bios)
    @settings(max_examples=10)
    def test_put_then_get_returns_same_data(self, name, company, email, bio):
        clear_tables("user_cloud_credentials", "users")
        db = TestSessionLocal()
        try:
            user = make_user(db, username="roundtrip_user", email="original@test.com")
            headers = auth_header(user)
        finally:
            db.close()

        payload = {"name": name, "company": company, "email": email, "bio": bio}
        put_resp = client.put("/api/user/profile", json=payload, headers=headers)
        assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"

        get_resp = client.get("/api/user/profile", headers=headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["name"] == name
        assert data["company"] == company
        assert data["email"] == email
        assert data["bio"] == bio


# ---------------------------------------------------------------------------
# Property 8: Duplicate email rejection
# ---------------------------------------------------------------------------

class TestProperty8DuplicateEmailRejection:

    @given(email_a=valid_emails, email_b=valid_emails)
    @settings(max_examples=10)
    def test_email_collision_returns_409(self, email_a, email_b):
        assume(email_a != email_b)
        clear_tables("user_cloud_credentials", "users")
        db = TestSessionLocal()
        try:
            make_user(db, username="user_a", email=email_a, name="User A")
            user_b = make_user(db, username="user_b", email=email_b, name="User B")
            headers_b = auth_header(user_b)
        finally:
            db.close()

        payload = {"name": "User B", "company": "B Corp", "email": email_a, "bio": ""}
        resp = client.put("/api/user/profile", json=payload, headers=headers_b)
        assert resp.status_code == 409

        get_resp = client.get("/api/user/profile", headers=headers_b)
        assert get_resp.json()["email"] == email_b


# ---------------------------------------------------------------------------
# Property 9: Invalid email format rejection
# ---------------------------------------------------------------------------

class TestProperty9InvalidEmailRejection:

    @given(bad_email=invalid_emails)
    @settings(max_examples=10)
    def test_invalid_email_returns_422(self, bad_email):
        clear_tables("user_cloud_credentials", "users")
        db = TestSessionLocal()
        try:
            user = make_user(db, username="invalid_email_user", email="valid@test.com")
            headers = auth_header(user)
        finally:
            db.close()

        payload = {"name": "Test", "company": "Co", "email": bad_email, "bio": ""}
        resp = client.put("/api/user/profile", json=payload, headers=headers)
        assert resp.status_code == 422
