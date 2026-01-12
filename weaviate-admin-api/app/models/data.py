from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class ObjectListResponse(BaseModel):
    """Object list response with pagination."""
    objects: List[Dict[str, Any]]
    total: int
    limit: int
    offset: int


class ObjectDetailResponse(BaseModel):
    """Object detail response."""
    id: str
    class_name: str
    properties: Dict[str, Any]
    vector: Optional[List[float]] = None
    additional: Optional[Dict[str, Any]] = None


class SimilarObjectsRequest(BaseModel):
    """Request to find similar objects."""
    object_id: str
    limit: Optional[int] = 5


class SimilarObjectsResponse(BaseModel):
    """Similar objects response."""
    similar_objects: List[Dict[str, Any]]

