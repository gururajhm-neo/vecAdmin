"""
GET /api/v1/provider/info

Returns the active vector-database provider identity and capabilities.
The frontend uses this to adapt the query editor language and help text.
"""

from fastapi import APIRouter
from app.providers import get_provider

router = APIRouter()


@router.get("/info")
async def get_provider_info():
    """
    Return the active vector-database provider name and capabilities.
    Public endpoint — no authentication required.
    """
    provider = get_provider()
    return {
        "provider": provider.provider_name,
        "query_language": provider.query_language,
        "ready": provider.is_ready(),
        "capabilities": {
            "vector_search":    True,
            "filters":          True,
            "full_text_search": provider.provider_name == "Weaviate",
            "graphql":          provider.query_language == "graphql",
            "aggregate":        provider.provider_name == "Weaviate",
        },
    }
