from pydantic import BaseModel, EmailStr


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

