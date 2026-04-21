"""Unit tests for the crypto module."""

import os

import pytest
from cryptography.fernet import Fernet

from app.crypto import decrypt_credential, encrypt_credential


@pytest.fixture(autouse=True)
def set_fernet_key(monkeypatch):
    """Set a valid FERNET_KEY env var for tests."""
    key = Fernet.generate_key().decode()
    monkeypatch.setenv("FERNET_KEY", key)


def test_encrypt_decrypt_round_trip():
    """Encrypting then decrypting returns the original plaintext."""
    plaintext = "my-secret-access-key-12345"
    ciphertext = encrypt_credential(plaintext)
    assert ciphertext != plaintext
    assert decrypt_credential(ciphertext) == plaintext


def test_encrypt_produces_different_ciphertexts():
    """Each encryption produces a different ciphertext (Fernet uses random IV)."""
    plaintext = "same-input"
    c1 = encrypt_credential(plaintext)
    c2 = encrypt_credential(plaintext)
    assert c1 != c2


def test_missing_fernet_key_raises(monkeypatch):
    """Raises RuntimeError when FERNET_KEY is not set."""
    monkeypatch.delenv("FERNET_KEY", raising=False)
    with pytest.raises(RuntimeError, match="FERNET_KEY environment variable is not set"):
        encrypt_credential("test")


def test_decrypt_with_wrong_key_fails(monkeypatch):
    """Decryption fails if the key changes between encrypt and decrypt."""
    plaintext = "secret"
    ciphertext = encrypt_credential(plaintext)

    # Change the key
    new_key = Fernet.generate_key().decode()
    monkeypatch.setenv("FERNET_KEY", new_key)

    with pytest.raises(Exception):
        decrypt_credential(ciphertext)
