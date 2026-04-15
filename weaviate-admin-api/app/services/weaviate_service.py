import weaviate
from typing import Optional, Dict, List, Any
from app.config import settings


class WeaviateService:
    """Weaviate client wrapper for database operations."""
    
    def __init__(self):
        """Initialize Weaviate client connection."""
        self._client = None
        self._connection_error = None
        try:
            self._client = weaviate.Client(
                url=settings.WEAVIATE_URL,
                timeout_config=(5, 15),  # 5s connect, 15s read timeout
                startup_period=2  # Shorter timeout for faster failure
            )
        except Exception as e:
            self._connection_error = str(e)
            print(f"Warning: Could not connect to Weaviate at {settings.WEAVIATE_URL}: {e}")
            print("The API will start but Weaviate operations will fail.")

    def _build_scope_filter(self, scope_value: Optional[int]) -> str:
        """Build GraphQL filter for configured scope field."""
        if scope_value is None:
            return ""
        value_operator = "valueInt"
        if settings.SCOPE_FIELD_VALUE_TYPE.lower() == "string":
            value_operator = "valueString"
            scope_literal = f'"{scope_value}"'
        else:
            scope_literal = str(scope_value)

        return f'''
        {{
            path: ["{settings.SCOPE_FIELD_NAME}"]
            operator: Equal
            {value_operator}: {scope_literal}
        }}
        '''
    
    @property
    def client(self):
        """Get Weaviate client, raise error if not connected."""
        if self._client is None:
            raise Exception(f"Weaviate is not connected: {self._connection_error}")
        return self._client
    
    def is_ready(self) -> bool:
        """Check if Weaviate is ready."""
        if self._client is None:
            return False
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
    
    def count_objects(self, class_name: str, project_id: Optional[int] = None) -> int:
        """Count objects in a class, optionally filtered by configured scope field."""
        where_clause = ""
        scope_filter = self._build_scope_filter(project_id)
        if scope_filter:
            where_clause = f'''
            where: {{
                operator: And
                operands: [{scope_filter}]
            }}
            '''
        
        query = f"""
        {{
            Aggregate {{
                {class_name}(
                    {where_clause}
                ) {{
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
        properties: Optional[List[str]] = None,
        search_text: Optional[str] = None,
        project_id: Optional[int] = None
    ) -> Dict:
        """Query objects with pagination, search, and scope filtering."""
        if properties is None:
            properties = ["_additional { id }"]
        
        props_str = " ".join(properties)
        
        # Build where clause conditions
        where_conditions = []
        
        # Filter by configured scope field if provided
        scope_filter = self._build_scope_filter(project_id)
        if scope_filter:
            where_conditions.append(scope_filter)
        
        # Add search filter if provided
        if search_text and search_text.strip():
            search_clean = search_text.strip()
            where_conditions.append(f'''
            {{
                path: ["_additional", "id"]
                operator: Like
                valueString: "*{search_clean}*"
            }}
            ''')
        
        # Combine conditions
        where_clause = ""
        if where_conditions:
            if len(where_conditions) == 1:
                where_clause = f"where: {where_conditions[0]}"
            else:
                where_clause = f"""
                where: {{
                    operator: And
                    operands: [
                        {where_conditions[0]},
                        {where_conditions[1]}
                    ]
                }}
                """
        
        query = f"""
        {{
            Get {{
                {class_name}(
                    limit: {limit}
                    offset: {offset}
                    {where_clause}
                ) {{
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
        properties: Optional[List[str]] = None,
        project_id: Optional[int] = None
    ) -> Dict:
        """Find similar objects using nearObject, optionally filtered by scope."""
        if properties is None:
            properties = ["_additional { id distance }"]
        
        props_str = " ".join(properties)
        
        # Add configured scope filter if provided
        where_clause = ""
        scope_filter = self._build_scope_filter(project_id)
        if scope_filter:
            where_clause = f'''
            where: {{
                operator: And
                operands: [{scope_filter}]
            }}
            '''
        
        query = f"""
        {{
            Get {{
                {class_name}(
                    nearObject: {{
                        id: "{object_id}"
                    }}
                    limit: {limit}
                    {where_clause}
                ) {{
                    {props_str}
                }}
            }}
        }}
        """
        
        return self.execute_graphql(query)


# Global instance
weaviate_service = WeaviateService()

