import weaviate
from typing import Optional, Dict, List, Any
from app.config import settings


class WeaviateService:
    """Weaviate client wrapper for database operations."""
    
    def __init__(self):
        """Initialize Weaviate client connection."""
        self.client = weaviate.Client(
            url=settings.WEAVIATE_URL,
            timeout_config=(5, 15)  # 5s connect, 15s read timeout
        )
    
    def is_ready(self) -> bool:
        """Check if Weaviate is ready."""
        try:
            return self.client.is_ready()
        except Exception:
            return False
    
    def get_nodes_status(self) -> Dict:
        """Get cluster nodes status."""
        try:
            return self.client.cluster.get_nodes_status()
        except Exception as e:
            return {"error": str(e)}
    
    def get_schema(self) -> Dict:
        """Get database schema."""
        try:
            return self.client.schema.get()
        except Exception as e:
            return {"error": str(e)}
    
    def get_class_schema(self, class_name: str) -> Optional[Dict]:
        """Get specific class schema."""
        try:
            return self.client.schema.get(class_name)
        except Exception:
            return None
    
    def execute_graphql(self, query: str) -> Dict:
        """Execute raw GraphQL query."""
        try:
            result = self.client.query.raw(query)
            return result
        except Exception as e:
            return {"error": str(e)}
    
    def get_object(self, uuid: str, class_name: Optional[str] = None) -> Optional[Dict]:
        """Get object by UUID."""
        try:
            return self.client.data_object.get_by_id(uuid, class_name=class_name)
        except Exception:
            return None
    
    def count_objects(self, class_name: str) -> int:
        """Count objects in a class using aggregate query."""
        query = f"""
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
        try:
            result = self.execute_graphql(query)
            if "data" in result and "Aggregate" in result["data"]:
                agg = result["data"]["Aggregate"].get(class_name, [])
                if agg and len(agg) > 0 and agg[0].get("meta"):
                    return agg[0]["meta"].get("count", 0)
            return 0
        except Exception:
            return 0
    
    def query_objects(
        self,
        class_name: str,
        limit: int = 50,
        offset: int = 0,
        properties: Optional[List[str]] = None
    ) -> Dict:
        """Query objects with pagination."""
        if properties is None:
            properties = ["_additional { id }"]
        
        props_str = " ".join(properties)
        
        query = f"""
        {{
            Get {{
                {class_name}(limit: {limit}, offset: {offset}) {{
                    {props_str}
                }}
            }}
        }}
        """
        
        return self.execute_graphql(query)
    
    def find_similar(
        self,
        class_name: str,
        object_id: str,
        limit: int = 5,
        properties: Optional[List[str]] = None
    ) -> Dict:
        """Find similar objects using nearObject."""
        if properties is None:
            properties = ["_additional { id distance }"]
        
        props_str = " ".join(properties)
        
        query = f"""
        {{
            Get {{
                {class_name}(
                    nearObject: {{
                        id: "{object_id}"
                    }}
                    limit: {limit}
                ) {{
                    {props_str}
                }}
            }}
        }}
        """
        
        return self.execute_graphql(query)


# Global instance
weaviate_service = WeaviateService()

