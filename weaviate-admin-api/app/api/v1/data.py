from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.models.data import (
    ObjectListResponse,
    ObjectDetailResponse,
    SimilarObjectsRequest,
    SimilarObjectsResponse
)
from app.services.weaviate_service import weaviate_service
from app.middleware.auth import get_current_user
from app.utils.weaviate_helpers import build_get_query

router = APIRouter()


@router.get("/{class_name}/objects", response_model=ObjectListResponse)
async def get_objects(
    class_name: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get objects from a class with pagination.
    Requires authentication.
    """
    try:
        # Get class schema to determine properties
        class_schema = weaviate_service.get_class_schema(class_name)
        
        if class_schema is None:
            raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
        
        # Extract property names (first 3-4 for preview)
        properties = []
        if "properties" in class_schema:
            for prop in class_schema["properties"][:4]:
                properties.append(prop["name"])
        
        # Query objects
        result = weaviate_service.query_objects(
            class_name=class_name,
            limit=limit,
            offset=offset,
            properties=properties + ["_additional { id creationTimeUnix }"]
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extract objects
        objects = []
        if "data" in result and "Get" in result["data"]:
            objects = result["data"]["Get"].get(class_name, [])
        
        # Get total count
        total = weaviate_service.count_objects(class_name)
        
        return ObjectListResponse(
            objects=objects,
            total=total,
            limit=limit,
            offset=offset
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching objects: {str(e)}")


@router.get("/{class_name}/objects/{object_id}")
async def get_object_detail(
    class_name: str,
    object_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific object.
    Requires authentication.
    """
    try:
        obj = weaviate_service.get_object(object_id, class_name)
        
        if obj is None:
            raise HTTPException(status_code=404, detail=f"Object '{object_id}' not found")
        
        return obj
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching object: {str(e)}")


@router.post("/{class_name}/similar", response_model=SimilarObjectsResponse)
async def find_similar_objects(
    class_name: str,
    request: SimilarObjectsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Find similar objects using vector similarity.
    Requires authentication.
    """
    try:
        # Get class schema to determine properties
        class_schema = weaviate_service.get_class_schema(class_name)
        
        if class_schema is None:
            raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
        
        # Extract property names
        properties = []
        if "properties" in class_schema:
            for prop in class_schema["properties"][:4]:
                properties.append(prop["name"])
        
        # Find similar objects
        result = weaviate_service.find_similar(
            class_name=class_name,
            object_id=request.object_id,
            limit=request.limit,
            properties=properties + ["_additional { id distance }"]
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extract similar objects
        similar_objects = []
        if "data" in result and "Get" in result["data"]:
            similar_objects = result["data"]["Get"].get(class_name, [])
        
        return SimilarObjectsResponse(similar_objects=similar_objects)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding similar objects: {str(e)}")

