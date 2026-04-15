"""
Provider factory.
Returns the correct VectorDBProvider based on the DB_PROVIDER config setting.

Supported values:
  weaviate  — Weaviate v3 (default)
  qdrant    — Qdrant (requires: pip install qdrant-client>=1.7.0)
  chroma    — ChromaDB (requires: pip install chromadb>=0.4.0)
  faiss     — FAISS local flat-file (requires: pip install faiss-cpu)
"""

from typing import Optional
from app.providers.base import VectorDBProvider

_provider_instance: Optional[VectorDBProvider] = None


def get_provider() -> VectorDBProvider:
    """Return the singleton provider instance, creating it on first call."""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = _create_provider()
    return _provider_instance


def reset_provider() -> None:
    """Force re-initialisation on next get_provider() call (useful for tests)."""
    global _provider_instance
    _provider_instance = None


def _create_provider() -> VectorDBProvider:
    from app.config import settings

    name = settings.DB_PROVIDER.lower()

    if name == "weaviate":
        from app.providers.weaviate_provider import WeaviateProvider
        return WeaviateProvider()

    if name == "qdrant":
        from app.providers.qdrant_provider import QdrantProvider
        return QdrantProvider()

    if name in ("chroma", "chromadb"):
        from app.providers.chroma_provider import ChromaProvider
        return ChromaProvider()

    if name == "faiss":
        from app.providers.faiss_provider import FAISSProvider
        return FAISSProvider()

    raise ValueError(
        f"Unknown DB_PROVIDER='{settings.DB_PROVIDER}'. "
        "Supported values: weaviate | qdrant | chroma | faiss"
    )
