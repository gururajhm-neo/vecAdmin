from pydantic import BaseModel
from typing import Dict, Any, Optional


class QueryExecuteRequest(BaseModel):
    """GraphQL query execution request."""
    query: str


class QueryExecuteResponse(BaseModel):
    """GraphQL query execution response."""
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None

