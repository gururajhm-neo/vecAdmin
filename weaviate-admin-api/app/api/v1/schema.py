from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.models.schema import SchemaResponse, ClassSchema
from app.services.weaviate_service import weaviate_service
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("", response_model=SchemaResponse)
async def get_schema(
    project_id: Optional[int] = Query(None, description="Filter by project_id. If not provided, uses user's project_id from token."),
    current_user: dict = Depends(get_current_user)
):
    """
    Get Weaviate schema with all classes.
    Requires authentication.
    
    Query Parameters:
    - project_id: Optional. If provided, filters object counts by this project_id.
                   If not provided, uses project_id from user's token.
                   If neither exists, shows all data.
    """
    try:
        # Use project_id from query parameter if provided, otherwise from token
        if project_id is None:
            project_id = current_user.get("project_id")
        
        schema = weaviate_service.get_schema()
        
        if "error" in schema:
            raise HTTPException(status_code=500, detail=schema["error"])
        
        classes = []
        
        if "classes" in schema:
            for class_obj in schema["classes"]:
                # Get object count for this class (filtered by project_id if provided)
                count = weaviate_service.count_objects(class_obj["class"], project_id=project_id)
                
                # Extract vector config if available
                vector_config = None
                if "vectorizer" in class_obj or "vectorIndexConfig" in class_obj:
                    vector_config = {
                        "vectorizer": class_obj.get("vectorizer"),
                        "vectorIndexConfig": class_obj.get("vectorIndexConfig"),
                        "moduleConfig": class_obj.get("moduleConfig")
                    }
                
                classes.append(
                    ClassSchema(
                        name=class_obj["class"],
                        description=class_obj.get("description"),
                        properties=class_obj.get("properties", []),
                        vectorConfig=vector_config,
                        objectCount=count
                    )
                )
        
        return SchemaResponse(classes=classes)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schema: {str(e)}")


@router.get("/{class_name}", response_model=ClassSchema)
async def get_class_schema(
    class_name: str,
    project_id: Optional[int] = Query(None, description="Filter by project_id. If not provided, uses user's project_id from token."),
    current_user: dict = Depends(get_current_user)
):
    """
    Get specific class schema.
    Requires authentication.
    
    Query Parameters:
    - project_id: Optional. If provided, filters object count by this project_id.
                   If not provided, uses project_id from user's token.
                   If neither exists, shows all data.
    """
    try:
        # Use project_id from query parameter if provided, otherwise from token
        if project_id is None:
            project_id = current_user.get("project_id")
        
        class_schema = weaviate_service.get_class_schema(class_name)
        
        if class_schema is None:
            raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
        
        # Get object count (filtered by project_id if provided)
        count = weaviate_service.count_objects(class_name, project_id=project_id)
        
        # Extract vector config
        vector_config = None
        if "vectorizer" in class_schema or "vectorIndexConfig" in class_schema:
            vector_config = {
                "vectorizer": class_schema.get("vectorizer"),
                "vectorIndexConfig": class_schema.get("vectorIndexConfig"),
                "moduleConfig": class_schema.get("moduleConfig")
            }
        
        return ClassSchema(
            name=class_schema["class"],
            description=class_schema.get("description"),
            properties=class_schema.get("properties", []),
            vectorConfig=vector_config,
            objectCount=count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching class schema: {str(e)}")

