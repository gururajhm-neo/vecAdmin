from fastapi import APIRouter, Depends
from typing import List, Dict
from app.services.weaviate_service import weaviate_service
from app.services.project_service import get_all_projects_with_metadata, get_project_name
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/available")
async def get_available_projects(current_user: dict = Depends(get_current_user)):
    """
    Get list of all project_ids available in Weaviate.
    Uses GraphQL Aggregate to efficiently get unique project_ids across all classes.
    """
    try:
        # Get schema to find all classes
        schema = weaviate_service.get_schema()
        
        if "error" in schema:
            return {"projects": [], "error": schema["error"]}
        
        project_ids = set()
        
        # Query each class using Aggregate to get unique project_ids
        if "classes" in schema:
            for class_obj in schema["classes"]:
                class_name = class_obj["class"]
                
                # Check if class has project_id property
                has_project_id = any(
                    prop.get("name") == "project_id" 
                    for prop in class_obj.get("properties", [])
                )
                
                if not has_project_id:
                    continue
                
                try:
                    # Use Aggregate with groupBy to get unique project_id values
                    query = f"""
                    {{
                        Aggregate {{
                            {class_name}(groupBy: ["project_id"]) {{
                                groupedBy {{
                                    value
                                }}
                            }}
                        }}
                    }}
                    """
                    
                    result = weaviate_service.execute_graphql(query)
                    
                    if "data" in result and "Aggregate" in result["data"]:
                        agg_data = result["data"]["Aggregate"].get(class_name, [])
                        for item in agg_data:
                            if "groupedBy" in item and "value" in item["groupedBy"]:
                                project_id_value = item["groupedBy"]["value"]
                                if project_id_value is not None:
                                    # Convert to int if it's a string
                                    try:
                                        project_id_int = int(project_id_value)
                                        project_ids.add(project_id_int)
                                    except (ValueError, TypeError):
                                        # If conversion fails, skip it
                                        print(f"[WARN] Could not convert project_id '{project_id_value}' to int for class {class_name}")
                    elif "errors" in result:
                        print(f"[ERROR] GraphQL errors for {class_name}: {result['errors']}")
                except Exception as e:
                    print(f"[ERROR] Failed to get project_ids for {class_name}: {str(e)}")
                    # Continue with other classes even if one fails
        
        projects_list = sorted(list(project_ids))
        print(f"[DEBUG] Found {len(projects_list)} unique project_ids: {projects_list}")
        
        # Enrich with project names from metadata
        projects_with_metadata = []
        for project_id in projects_list:
            projects_with_metadata.append({
                "id": project_id,
                "name": get_project_name(project_id)
            })
        
        return {
            "projects": projects_list,  # Keep for backward compatibility
            "projects_with_metadata": projects_with_metadata,  # New: includes names
            "total_projects": len(projects_list)
        }
        
    except Exception as e:
        print(f"[ERROR] Exception in get_available_projects: {str(e)}")
        return {"projects": [], "error": str(e)}

