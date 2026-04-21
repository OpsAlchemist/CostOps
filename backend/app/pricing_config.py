"""Pricing source configuration — runtime-switchable between AI and native cloud APIs."""

import os

# Module-level variable: reads from env on import, can be changed at runtime
_pricing_source: str = os.getenv("PRICING_SOURCE", "ai")

VALID_SOURCES = {"ai", "api"}


def get_pricing_source() -> str:
    """Return the current pricing data source ('ai' or 'api')."""
    return _pricing_source


def set_pricing_source(source: str) -> None:
    """Switch the pricing source at runtime. No restart required.

    Args:
        source: Must be 'ai' or 'api'.

    Raises:
        ValueError: If source is not one of the valid options.
    """
    global _pricing_source
    if source not in VALID_SOURCES:
        raise ValueError(f"Invalid pricing source: {source!r}. Must be one of {VALID_SOURCES}")
    _pricing_source = source
