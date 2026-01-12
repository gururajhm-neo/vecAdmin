import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from app.config import settings

# Hardcoded test users for MVP
TEST_USERS = [
    {"email": "engineer1@testneo.ai", "password": "admin123", "name": "Engineer 1"},
    {"email": "engineer2@testneo.ai", "password": "admin123", "name": "Engineer 2"}
]


def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """
    Authenticate user with email and password.
    Returns user dict if valid, None otherwise.
    """
    for user in TEST_USERS:
        if user["email"] == email and user["password"] == password:
            return {"email": user["email"], "name": user["name"]}
    return None


def create_access_token(user: Dict) -> str:
    """
    Create JWT access token for authenticated user.
    Token expires in 24 hours.
    """
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    payload = {
        "email": user["email"],
        "name": user["name"],
        "exp": expire
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and validate JWT token.
    Returns payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

