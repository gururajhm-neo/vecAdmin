import json
from pydantic_settings import BaseSettings
from typing import Any, Dict, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Vector DB provider ────────────────────────────────────────────────────
    # Which database to connect to. Supported: weaviate | qdrant | chroma
    DB_PROVIDER: str = "weaviate"

    # ── Weaviate ──────────────────────────────────────────────────────────────
    WEAVIATE_URL: str = "http://localhost:8080"

    # ── Qdrant ────────────────────────────────────────────────────────────────
    QDRANT_HOST:    str  = "localhost"
    QDRANT_PORT:    int  = 6333
    QDRANT_API_KEY: str  = ""
    QDRANT_HTTPS:   bool = False

    # ── ChromaDB ──────────────────────────────────────────────────────────────
    CHROMA_HOST:     str = "localhost"
    CHROMA_PORT:     int = 8000
    CHROMA_TENANT:   str = "default_tenant"
    CHROMA_DATABASE: str = "default_database"

    # ── FAISS (local flat-file) ───────────────────────────────────────────────
    FAISS_INDEX_DIR: str = "./faiss_data"

    # ── AI provider ────────────────────────────────────────────────────────
    # Which LLM backend to use: groq | openai | anthropic | ollama
    AI_PROVIDER: str = "groq"

    # Groq (default — free tier at console.groq.com)
    GROQ_API_KEY:      str = ""
    GROQ_MODEL:        str = "llama-3.3-70b-versatile"
    GROQ_MAX_TOKENS:   int = 32768
    GROQ_MAX_REQUESTS: int = 1000

    # OpenAI (platform.openai.com)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL:   str = "gpt-4o-mini"

    # Anthropic (console.anthropic.com)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL:   str = "claude-3-haiku-20240307"

    # Ollama — local, no key needed (ollama.com)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL:    str = "llama3"

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000"

    # ── API meta ──────────────────────────────────────────────────────────────
    API_V1_PREFIX:   str = "/api/v1"
    APP_NAME:        str = "VecAdmin API"
    APP_DESCRIPTION: str = "Multi-provider vector database admin API"
    APP_VERSION:     str = "2.0.0"

    # ── Data scoping ──────────────────────────────────────────────────────────
    SCOPE_FIELD_NAME:       str = "project_id"
    SCOPE_FIELD_VALUE_TYPE: str = "int"   # int | string

    # ── Optional bootstrap auth users (JSON array) ────────────────────────────
    AUTH_USERS_JSON: str = ""

    # ── Optional project metadata (JSON object) ───────────────────────────────
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

