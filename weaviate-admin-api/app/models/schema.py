from pydantic import BaseModel
from typing import List, Dict, Optional, Any


class Property(BaseModel):
    """Schema property."""
    name: str
    dataType: List[str]
    indexed: Optional[bool] = True


class ClassSchema(BaseModel):
    """Class schema information."""
    name: str
    description: Optional[str] = None
    properties: List[Dict[str, Any]]
    vectorConfig: Optional[Dict[str, Any]] = None
    objectCount: Optional[int] = 0


class SchemaResponse(BaseModel):
    """Schema response with all classes."""
    classes: List[ClassSchema]

