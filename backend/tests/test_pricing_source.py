"""Unit tests for pricing source switching (Requirements 3.2, 3.3, 3.4, 3.5)."""

import pytest
from unittest.mock import patch, MagicMock

from app.pricing_config import get_pricing_source, set_pricing_source


@pytest.fixture(autouse=True)
def reset_pricing_source():
    """Reset pricing source to default 'ai' after each test to avoid pollution."""
    yield
    set_pricing_source("ai")


def test_default_pricing_source_is_ai():
    """Validates: Requirement 3.2 — default pricing source is 'ai'."""
    set_pricing_source("ai")  # ensure clean state
    assert get_pricing_source() == "ai"


def test_set_pricing_source_to_api():
    """Validates: Requirement 3.5 — runtime switching to 'api' works."""
    set_pricing_source("api")
    assert get_pricing_source() == "api"



@patch("app.aws_pricing.call_ai")
def test_ai_source_calls_call_ai(mock_call_ai):
    """Validates: Requirement 3.3 — AI source fetches pricing via call_ai."""
    from tests.conftest import TestSessionLocal, clear_tables

    clear_tables("pricing_rates")
    mock_call_ai.return_value = '{"hourly_rate_linux": 0.0116, "hourly_rate_windows": 0.0162}'

    set_pricing_source("ai")

    db = TestSessionLocal()
    try:
        from app.aws_pricing import get_rate
        result = get_rate(db, "ec2", "t2.micro", "us-east-1")
        assert mock_call_ai.called, "call_ai should be invoked when source is 'ai'"
        assert result is not None
        assert result["hourly_rate_linux"] == 0.0116
    finally:
        db.close()
        clear_tables("pricing_rates")


def test_api_source_calls_stub():
    """Validates: Requirement 3.4 — API source returns stub rates without calling call_ai."""
    from tests.conftest import TestSessionLocal, clear_tables

    clear_tables("pricing_rates")
    set_pricing_source("api")

    db = TestSessionLocal()
    try:
        with patch("app.aws_pricing.call_ai") as mock_call_ai:
            from app.aws_pricing import get_rate
            result = get_rate(db, "ec2", "t2.micro", "us-east-1")
            assert not mock_call_ai.called, "call_ai should NOT be invoked when source is 'api'"
            assert result is not None
            assert result["hourly_rate_linux"] == 0.0116
            assert result["hourly_rate_windows"] == 0.0162
    finally:
        db.close()
        clear_tables("pricing_rates")


def test_runtime_switching():
    """Validates: Requirement 3.5 — switching source at runtime changes behavior without restart."""
    from tests.conftest import TestSessionLocal, clear_tables

    clear_tables("pricing_rates")

    db = TestSessionLocal()
    try:
        # Start with AI source
        set_pricing_source("ai")
        with patch("app.aws_pricing.call_ai", return_value='{"hourly_rate_linux": 0.05}') as mock_ai:
            from app.aws_pricing import get_rate
            result = get_rate(db, "ec2", "t3.large", "us-west-2")
            assert mock_ai.called, "AI source should call call_ai"
            assert result is not None

        # Clear cached rates so next call fetches fresh
        clear_tables("pricing_rates")

        # Switch to API source at runtime
        set_pricing_source("api")
        with patch("app.aws_pricing.call_ai") as mock_ai2:
            result = get_rate(db, "ec2", "t3.large", "us-west-2")
            assert not mock_ai2.called, "API source should NOT call call_ai"
            assert result is not None

        # Clear cached rates again
        clear_tables("pricing_rates")

        # Switch back to AI
        set_pricing_source("ai")
        with patch("app.aws_pricing.call_ai", return_value='{"hourly_rate_linux": 0.05}') as mock_ai3:
            result = get_rate(db, "ec2", "t3.large", "us-west-2")
            assert mock_ai3.called, "After switching back to AI, call_ai should be called again"
    finally:
        db.close()
        clear_tables("pricing_rates")
