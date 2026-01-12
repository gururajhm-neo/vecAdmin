from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response model."""
    token: str
    user: dict


class UserResponse(BaseModel):
    """User information response."""
    email: str
    name: str
    project_id: Optional[int] = None

