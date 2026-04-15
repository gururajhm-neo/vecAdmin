"""
AI endpoints — natural language → query + result explainer.

Routes
──────
  POST /api/v1/ai/nl-to-query   — NL text → provider-native query string
  POST /api/v1/ai/explain       — query + results → plain-English summary
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from app.middleware.auth import get_current_user
from app.providers import get_provider
from app.services.ai_service import ai_service

router = APIRouter()


# ── Request / Response models ──────────────────────────────────────────────────

class NLQueryRequest(BaseModel):
    natural_language: str
    schema_classes: Optional[List[Dict[str, Any]]] = None  # sent by frontend from /schema


class NLQueryResponse(BaseModel):
    query: Optional[str] = None
    error: Optional[str] = None
    provider: Optional[str] = None
    query_language: Optional[str] = None


class ExplainRequest(BaseModel):
    query: str
    results: Dict[str, Any]


class ExplainResponse(BaseModel):
    explanation: Optional[str] = None
    error: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/nl-to-query", response_model=NLQueryResponse)
async def nl_to_query(
    request: NLQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Convert a natural language request into a provider-native query.
    The frontend passes its cached schema so no extra DB round-trip is needed.
    """
    provider = get_provider()
    result = ai_service.nl_to_query(
        natural_language=request.natural_language,
        provider=provider.provider_name,
        query_language=provider.query_language,
        schema_classes=request.schema_classes or [],
    )
    if "error" in result:
        return NLQueryResponse(error=result["error"])
    return NLQueryResponse(
        query=result["query"],
        provider=provider.provider_name,
        query_language=provider.query_language,
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain_results(
    request: ExplainRequest,
    current_user: dict = Depends(get_current_user),
):
    """Return a plain-English explanation of a query's results."""
    provider = get_provider()
    result = ai_service.explain_results(
        query=request.query,
        results=request.results,
        provider=provider.provider_name,
    )
    if "error" in result:
        return ExplainResponse(error=result["error"])
    return ExplainResponse(explanation=result["explanation"])


@router.get("/status")
async def ai_status(current_user: dict = Depends(get_current_user)):
    """Check if AI features are available."""
    return {
        "available": ai_service.available,
        "provider": "Groq" if ai_service.available else None,
        "model": __import__('app.config', fromlist=['settings']).settings.GROQ_MODEL if ai_service.available else None,
    }
