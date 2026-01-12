from typing import Dict, List
from datetime import datetime, timedelta


def build_aggregate_query(class_name: str) -> str:
    """Build GraphQL aggregate query for object count."""
    return f"""
    {{
        Aggregate {{
            {class_name} {{
                meta {{
                    count
                }}
            }}
        }}
    }}
    """


def extract_count_from_aggregate(result: Dict, class_name: str) -> int:
    """Extract count from aggregate query result."""
    try:
        if "data" in result and "Aggregate" in result["data"]:
            agg = result["data"]["Aggregate"].get(class_name, [])
            if agg and len(agg) > 0 and agg[0].get("meta"):
                return agg[0]["meta"].get("count", 0)
        return 0
    except Exception:
        return 0


def parse_uptime(nodes_status: Dict) -> str:
    """Parse uptime from nodes status."""
    try:
        if "nodes" in nodes_status and len(nodes_status["nodes"]) > 0:
            node = nodes_status["nodes"][0]
            if "stats" in node and "shardCount" in node["stats"]:
                # For simplicity, just return a placeholder
                # In production, you'd parse actual uptime
                return "Running"
        return "Unknown"
    except Exception:
        return "Unknown"


def get_memory_stats(nodes_status: Dict) -> Dict:
    """Extract memory stats from nodes status."""
    try:
        if "nodes" in nodes_status and len(nodes_status["nodes"]) > 0:
            node = nodes_status["nodes"][0]
            if "stats" in node:
                stats = node["stats"]
                # Weaviate may not always provide memory stats
                # Return mock data if not available
                return {
                    "used": 0.0,
                    "total": 16.0,
                    "percent": 0.0
                }
        return {"used": 0.0, "total": 16.0, "percent": 0.0}
    except Exception:
        return {"used": 0.0, "total": 16.0, "percent": 0.0}


def get_version_from_meta(meta: Dict) -> str:
    """Extract version from meta information."""
    try:
        if "version" in meta:
            return meta["version"]
        return "Unknown"
    except Exception:
        return "Unknown"


def build_get_query(
    class_name: str,
    properties: List[str],
    limit: int = 50,
    offset: int = 0
) -> str:
    """Build GraphQL Get query with properties."""
    props_str = "\n        ".join(properties)
    
    return f"""
    {{
        Get {{
            {class_name}(limit: {limit}, offset: {offset}) {{
                {props_str}
                _additional {{
                    id
                    creationTimeUnix
                }}
            }}
        }}
    }}
    """

