import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from app.config import settings

# Hardcoded test users for MVP
# Each user is mapped to a project_id (customer identifier) and optionally org_id (organization identifier)
# org_id provides additional isolation layer - if two organizations have same project_id, they won't see each other's data
TEST_USERS = [
    {
        "email": "engineer1@testneo.ai", 
        "password": "admin123", 
        "name": "Engineer 1",
        "project_id": 21,  # Map to project_id from Weaviate
        "org_id": None  # Optional: organization identifier for multi-tenant isolation
    },
    {
        "email": "engineer2@testneo.ai", 
        "password": "admin123", 
        "name": "Engineer 2",
        "project_id": 21,  # Can be same or different project
        "org_id": None  # Optional: organization identifier for multi-tenant isolation
    }
]


def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """
    Authenticate user with email and password.
    Returns user dict if valid, None otherwise.
    Includes project_id and org_id for data isolation.
    """
    for user in TEST_USERS:
        if user["email"] == email and user["password"] == password:
            return {
                "email": user["email"], 
                "name": user["name"],
                "project_id": user.get("project_id"),
                "org_id": user.get("org_id")  # Organization identifier for multi-tenant isolation
            }
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
        "project_id": user.get("project_id"),  # Include project_id in token
        "org_id": user.get("org_id"),  # Include org_id in token for multi-tenant isolation
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

