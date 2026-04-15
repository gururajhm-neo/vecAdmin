import json
from pydantic_settings import BaseSettings
from typing import Any, Dict, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Weaviate Configuration
    WEAVIATE_URL: str = "http://localhost:8080"
    
    # JWT Configuration
    JWT_SECRET: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    APP_NAME: str = "Weaviate Admin API"
    APP_DESCRIPTION: str = "API for the Weaviate Admin Dashboard"
    APP_VERSION: str = "1.0.0"

    # Data scoping configuration
    SCOPE_FIELD_NAME: str = "project_id"
    SCOPE_FIELD_VALUE_TYPE: str = "int"  # Supported values: int, string

    # Optional auth bootstrap users as JSON string
    # Example:
    # [{"email":"admin@example.com","password":"admin123","name":"Admin","project_id":21}]
    AUTH_USERS_JSON: str = ""

    # Optional metadata map for scope IDs as JSON object
    # Example:
    # {"21":{"name":"Main Project","org_id":null}}
    PROJECT_METADATA_JSON: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def auth_users(self) -> List[Dict[str, Any]]:
        """Return configured authentication users from JSON."""
        if not self.AUTH_USERS_JSON.strip():
            return []
        try:
            value = json.loads(self.AUTH_USERS_JSON)
            if isinstance(value, list):
                return [entry for entry in value if isinstance(entry, dict)]
            return []
        except json.JSONDecodeError:
            return []

    @property
    def project_metadata(self) -> Dict[int, Dict[str, Any]]:
        """Return project metadata from JSON with integer keys."""
        if not self.PROJECT_METADATA_JSON.strip():
            return {}
        try:
            raw = json.loads(self.PROJECT_METADATA_JSON)
            if not isinstance(raw, dict):
                return {}
            parsed: Dict[int, Dict[str, Any]] = {}
            for key, value in raw.items():
                if isinstance(value, dict):
                    try:
                        parsed[int(key)] = value
                    except (TypeError, ValueError):
                        continue
            return parsed
        except json.JSONDecodeError:
            return {}
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

