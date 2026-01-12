from fastapi import APIRouter, HTTPException, status, Depends
from app.models.auth import LoginRequest, LoginResponse, UserResponse
from app.services.auth_service import authenticate_user, create_access_token
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return JWT token.
    
    Test credentials:
    - engineer1@testneo.ai / admin123
    - engineer2@testneo.ai / admin123
    """
    user = authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(user)
    
    return LoginResponse(
        token=token,
        user=user
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    Requires valid JWT token.
    """
    return UserResponse(
        email=current_user["email"],
        name=current_user["name"]
    )

