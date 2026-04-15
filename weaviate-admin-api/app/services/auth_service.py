import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from app.config import settings

DEFAULT_DEMO_USERS: List[Dict[str, Any]] = [
    {
        "email": "engineer1@example.com",
        "password": "admin123",
        "name": "Engineer 1",
        "project_id": 21,
        "org_id": None,
    },
    {
        "email": "engineer2@example.com",
        "password": "admin123",
        "name": "Engineer 2",
        "project_id": 21,
        "org_id": None,
    },
]


def _get_auth_users() -> List[Dict[str, Any]]:
    """Resolve auth users from environment with safe fallback."""
    return settings.auth_users or DEFAULT_DEMO_USERS


def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """
    Authenticate user with email and password.
    Returns user dict if valid, None otherwise.
    Includes project_id and org_id for data isolation.
    """
    for user in _get_auth_users():
        if user["email"] == email and user["password"] == password:
            scope_field_name = settings.SCOPE_FIELD_NAME
            scope_value = user.get(scope_field_name, user.get("project_id"))
            return {
                "email": user["email"],
                "name": user["name"],
                "project_id": scope_value,
                "org_id": user.get("org_id"),
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

