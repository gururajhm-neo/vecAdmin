from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.models.dashboard import DashboardOverview, HealthStatus, MemoryUsage
from app.services.weaviate_service import weaviate_service
from app.middleware.auth import get_current_user
from app.utils.weaviate_helpers import (
    build_aggregate_query,
    extract_count_from_aggregate,
    parse_uptime,
    get_memory_stats,
    get_version_from_meta
)

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(current_user: dict = Depends(get_current_user)):
    """
    Get dashboard overview with health status, object counts, and memory usage.
    Requires authentication.
    """
    try:
        # Check if Weaviate is ready
        is_ready = weaviate_service.is_ready()
        
        # Get nodes status
        nodes_status = weaviate_service.get_nodes_status()
        
        # Get schema to find all classes
        schema = weaviate_service.get_schema()
        
        # Build health status
        health = HealthStatus(
            status="healthy" if is_ready else "unhealthy",
            uptime=parse_uptime(nodes_status) if is_ready else None,
            last_checked=datetime.utcnow().isoformat()
        )
        
        # Get object counts for each class
        object_counts = {}
        total_objects = 0
        
        if "classes" in schema:
            for class_obj in schema["classes"]:
                class_name = class_obj["class"]
                count = weaviate_service.count_objects(class_name)
                object_counts[class_name] = count
                total_objects += count
        
        # Get memory stats
        memory_stats = get_memory_stats(nodes_status)
        memory = MemoryUsage(
            used=memory_stats["used"],
            total=memory_stats["total"],
            percent=memory_stats["percent"]
        )
        
        # Get version
        version = None
        hostname = None
        if "nodes" in nodes_status and len(nodes_status["nodes"]) > 0:
            node = nodes_status["nodes"][0]
            version = node.get("version", "Unknown")
            hostname = node.get("name", "Unknown")
        
        return DashboardOverview(
            health=health,
            memory=memory,
            object_counts=object_counts,
            total_objects=total_objects,
            version=version,
            hostname=hostname
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")

