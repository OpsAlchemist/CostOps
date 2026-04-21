"""Fernet encryption module for secure credential storage."""

import os

from cryptography.fernet import Fernet


def _get_fernet() -> Fernet:
    """Get a Fernet instance using the key from FERNET_KEY env var."""
    key = os.environ.get("FERNET_KEY")
    if not key:
        raise RuntimeError("FERNET_KEY environment variable is not set")
    return Fernet(key.encode())


def encrypt_credential(plaintext: str) -> str:
    """Encrypt a credential string using Fernet. Returns base64-encoded ciphertext."""
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_credential(ciphertext: str) -> str:
    """Decrypt a Fernet-encrypted credential string. Returns plaintext."""
    f = _get_fernet()
    return f.decrypt(ciphertext.encode()).decode()
