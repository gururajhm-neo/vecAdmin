"""
Weaviate vector-database provider.

Wraps the official weaviate-client v3 SDK and normalises all responses to
the shared VectorDBProvider contract.  This is a direct refactoring of the
original weaviate_service.py — behaviour is identical.
"""

import weaviate
from typing import Any, Dict, List, Optional

from app.config import settings
from app.providers.base import VectorDBProvider


class WeaviateProvider(VectorDBProvider):
    """Full Weaviate implementation of VectorDBProvider."""

    def __init__(self) -> None:
        self._client = None
        self._connection_error: Optional[str] = None
        try:
            self._client = weaviate.Client(
                url=settings.WEAVIATE_URL,
                timeout_config=(5, 15),   # (connect_timeout, read_timeout)
                startup_period=2,
            )
        except Exception as exc:
            self._connection_error = str(exc)
            print(
                f"[WeaviateProvider] Warning: could not connect to "
                f"{settings.WEAVIATE_URL}: {exc}\n"
                "The API will start but Weaviate operations will fail."
            )

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return "Weaviate"

    @property
    def query_language(self) -> str:
        return "graphql"

    # ── Internal helpers ──────────────────────────────────────────────────────

    @property
    def _weaviate(self):
        if self._client is None:
            raise RuntimeError(
                f"Weaviate not connected: {self._connection_error}"
            )
        return self._client

    def _build_scope_filter(self, scope_value: Optional[int]) -> str:
        """Build a GraphQL where-filter fragment for the configured scope field."""
        if scope_value is None:
            return ""
        if settings.SCOPE_FIELD_VALUE_TYPE.lower() == "string":
            op = "valueString"
            lit = f'"{scope_value}"'
        else:
            op = "valueInt"
            lit = str(scope_value)
        return (
            f'{{ path: ["{settings.SCOPE_FIELD_NAME}"] '
            f'operator: Equal {op}: {lit} }}'
        )

    # ── Health ────────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        if self._client is None:
            return False
        try:
            return self._weaviate.is_ready()
        except Exception:
            return False

    def get_cluster_status(self) -> Dict[str, Any]:
        try:
            return self._weaviate.cluster.get_nodes_status()
        except Exception as exc:
            return {"error": str(exc)}

    # Legacy alias kept so weaviate_helpers.py calls still work
    def get_nodes_status(self) -> Dict[str, Any]:
        return self.get_cluster_status()

    # ── Schema ────────────────────────────────────────────────────────────────

    def get_schema(self) -> Dict[str, Any]:
        try:
            return self._weaviate.schema.get()
        except Exception as exc:
            return {"error": str(exc)}

    def get_class_schema(self, class_name: str) -> Optional[Dict[str, Any]]:
        try:
            return self._weaviate.schema.get(class_name)
        except Exception:
            return None

    # ── Data ──────────────────────────────────────────────────────────────────

    def count_objects(
        self, class_name: str, project_id: Optional[int] = None
    ) -> int:
        scope = self._build_scope_filter(project_id)
        where = (
            f"where: {{ operator: And operands: [{scope}] }}" if scope else ""
        )
        # Only add parentheses when there's an actual filter — empty () is invalid GraphQL
        args = f"({where})" if where else ""
        gql = f"""
        {{
            Aggregate {{
                {class_name}{args} {{
                    meta {{ count }}
                }}
            }}
        }}
        """
        try:
            result = self.execute_query(gql)
            agg = result.get("data", {}).get("Aggregate", {}).get(class_name, [])
            if agg and agg[0].get("meta"):
                count = agg[0]["meta"].get("count", 0)
                # If scoped count is 0, fall back to unfiltered total —
                # objects may not have the project_id field set.
                if count == 0 and project_id is not None:
                    return self.count_objects(class_name, project_id=None)
                return count
        except Exception:
            pass
        return 0

    def query_objects(
        self,
        class_name: str,
        limit: int = 50,
        offset: int = 0,
        properties: Optional[List[str]] = None,
        search_text: Optional[str] = None,
        project_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        props = properties or ["_additional { id }"]
        props_str = " ".join(props)

        conditions = []
        scope = self._build_scope_filter(project_id)
        if scope:
            conditions.append(scope)
        if search_text and search_text.strip():
            conditions.append(
                f'{{ path: ["_additional", "id"] operator: Like '
                f'valueString: "*{search_text.strip()}*" }}'
            )

        if conditions:
            if len(conditions) == 1:
                where = f"where: {conditions[0]}"
            else:
                ops = ", ".join(conditions)
                where = f"where: {{ operator: And operands: [{ops}] }}"
        else:
            where = ""

        gql = f"""
        {{
            Get {{
                {class_name}(limit: {limit} offset: {offset} {where}) {{
                    {props_str}
                }}
            }}
        }}
        """
        return self.execute_query(gql)

    def get_object(
        self, uuid: str, class_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            return self._weaviate.data_object.get_by_id(
                uuid, class_name=class_name
            )
        except Exception:
            return None

    def find_similar(
        self,
        class_name: str,
        object_id: str,
        limit: int = 5,
        properties: Optional[List[str]] = None,
        project_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        props = properties or ["_additional { id distance }"]
        props_str = " ".join(props)
        scope = self._build_scope_filter(project_id)
        where = (
            f"where: {{ operator: And operands: [{scope}] }}" if scope else ""
        )
        gql = f"""
        {{
            Get {{
                {class_name}(
                    nearObject: {{ id: "{object_id}" }}
                    limit: {limit}
                    {where}
                ) {{
                    {props_str}
                }}
            }}
        }}
        """
        return self.execute_query(gql)

    # ── Query ─────────────────────────────────────────────────────────────────

    def execute_query(self, query: str) -> Dict[str, Any]:
        try:
            return self._weaviate.query.raw(query)
        except Exception as exc:
            return {"error": str(exc)}

    # Legacy alias used via the shim
    def execute_graphql(self, query: str) -> Dict[str, Any]:
        return self.execute_query(query)
