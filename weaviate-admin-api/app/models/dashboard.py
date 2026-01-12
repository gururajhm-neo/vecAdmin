from pydantic import BaseModel
from typing import Dict, Optional


class HealthStatus(BaseModel):
    """Health status information."""
    status: str
    uptime: Optional[str] = None
    last_checked: Optional[str] = None


class MemoryUsage(BaseModel):
    """Memory usage information."""
    used: float
    total: float
    percent: float


class DashboardOverview(BaseModel):
    """Dashboard overview response."""
    health: HealthStatus
    memory: Optional[MemoryUsage] = None
    object_counts: Dict[str, int]
    total_objects: int
    version: Optional[str] = None
    hostname: Optional[str] = None
    project_id: Optional[int] = None  # User's project ID for filtering

