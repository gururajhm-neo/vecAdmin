"""
Project metadata service - maps project_id to project names and handles organization isolation.
"""
from typing import Dict, Optional, List, Any

# Project metadata mapping
# In production, this should come from a database or external service
# Format: {project_id: {"name": "Project Name", "org_id": org_id}}
# These are the actual project IDs found in your Weaviate instance
PROJECT_METADATA: Dict[int, Dict[str, Any]] = {
    1: {"name": "Project 1", "org_id": None},
    9: {"name": "Project 9", "org_id": None},
    10: {"name": "Project 10", "org_id": None},
    21: {"name": "Project 21 (Main)", "org_id": None},  # Has most data
    22: {"name": "Project 22", "org_id": None},
    23: {"name": "Project 23", "org_id": None},
    24: {"name": "Project 24", "org_id": None},
    999: {"name": "Test Project", "org_id": None},  # May not have data
}

# Organization metadata (for future multi-tenant support)
# Format: {org_id: {"name": "Organization Name"}}
ORG_METADATA: Dict[int, Dict[str, str]] = {}


def get_project_name(project_id: int) -> str:
    """
    Get project name for a given project_id.
    Returns project name if found, otherwise returns "Project {project_id}".
    """
    if project_id in PROJECT_METADATA:
        return PROJECT_METADATA[project_id].get("name", f"Project {project_id}")
    return f"Project {project_id}"


def get_project_org_id(project_id: int) -> Optional[int]:
    """
    Get organization ID for a given project_id.
    Returns org_id if project has one assigned, None otherwise.
    """
    if project_id in PROJECT_METADATA:
        return PROJECT_METADATA[project_id].get("org_id")
    return None


def get_all_projects_with_metadata() -> List[Dict]:
    """
    Get all projects with their metadata (id, name, org_id).
    Returns list of dicts with project information.
    """
    projects = []
    for project_id, metadata in PROJECT_METADATA.items():
        projects.append({
            "id": project_id,
            "name": metadata.get("name", f"Project {project_id}"),
            "org_id": metadata.get("org_id")
        })
    return sorted(projects, key=lambda x: x["id"])


def add_project_metadata(project_id: int, name: str, org_id: Optional[int] = None):
    """
    Add or update project metadata.
    In production, this should update a database.
    """
    PROJECT_METADATA[project_id] = {
        "name": name,
        "org_id": org_id
    }


def get_projects_by_org(org_id: int) -> List[int]:
    """
    Get all project_ids for a given organization.
    Useful for filtering when org_id is provided.
    """
    return [
        pid for pid, metadata in PROJECT_METADATA.items()
        if metadata.get("org_id") == org_id
    ]

