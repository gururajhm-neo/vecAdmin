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
    project_id: Optional[int] = Query(None, description="Filter by project_id. If not provided, uses user's project_id from token."),
    current_user: dict = Depends(get_current_user)
):
    """
    Get objects from a class with pagination, filtered by project_id.
    Requires authentication.
    
    Query Parameters:
    - project_id: Optional. If provided, filters data by this project_id.
                   If not provided, uses project_id from user's token.
                   If neither exists, shows all data.
    """
    try:
        # Use project_id from query parameter if provided, otherwise from token
        if project_id is None:
            project_id = current_user.get("project_id")
        
        # Get class schema to determine properties
        class_schema = weaviate_service.get_class_schema(class_name)
        
        if class_schema is None:
            raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
        
        # Extract property names (first 3-4 for preview, include project_id)
        properties = []
        if "properties" in class_schema:
            # Always include project_id if it exists
            prop_names = [p["name"] for p in class_schema["properties"]]
            if "project_id" in prop_names:
                properties.append("project_id")
            
            # Add other properties (excluding project_id if already added)
            for prop in class_schema["properties"]:
                if prop["name"] != "project_id" and len(properties) < 4:
                    properties.append(prop["name"])
        
        # Query objects with project_id filter
        result = weaviate_service.query_objects(
            class_name=class_name,
            limit=limit,
            offset=offset,
            properties=properties + ["_additional { id creationTimeUnix }"],
            search_text=search,
            project_id=project_id  # Filter by user's project
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extract objects
        objects = []
        if "data" in result and "Get" in result["data"]:
            objects = result["data"]["Get"].get(class_name, [])
        
        # Get total count (filtered by project_id if provided)
        total = weaviate_service.count_objects(class_name, project_id=project_id)
        
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
    Find similar objects using vector similarity, filtered by user's project_id.
    Requires authentication.
    """
    try:
        # Extract project_id from user token (optional - if None, no filtering)
        project_id = current_user.get("project_id")
        
        # Get class schema to determine properties
        class_schema = weaviate_service.get_class_schema(class_name)
        
        if class_schema is None:
            raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
        
        # Extract property names
        properties = []
        if "properties" in class_schema:
            for prop in class_schema["properties"][:4]:
                properties.append(prop["name"])
        
        # Find similar objects with project_id filter
        result = weaviate_service.find_similar(
            class_name=class_name,
            object_id=request.object_id,
            limit=request.limit,
            properties=properties + ["_additional { id distance }"],
            project_id=project_id  # Filter by user's project
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

