from cryptography.fernet import Fernet
import base64
import os

ENCRYPTION_KEY = base64.urlsafe_b64encode(b"your-32-byte-key-change-in-prod!")
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data like API keys"""
    encrypted_data = cipher_suite.encrypt(data.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    try:
        decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = cipher_suite.decrypt(decoded_data)
        return decrypted_data.decode()
    except Exception:
        raise ValueError("Failed to decrypt data")
