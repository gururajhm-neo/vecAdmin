"""
Qdrant vector-database provider.

Requires: pip install "qdrant-client>=1.7.0"

Normalises Qdrant collections/points into the shared VectorDBProvider schema
so the existing REST routes and React UI work without modification.
"""

import json
from typing import Any, Dict, List, Optional

from app.config import settings
from app.providers.base import VectorDBProvider

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Filter,
        FieldCondition,
        MatchValue,
    )
    _QDRANT_AVAILABLE = True
except ImportError:
    _QDRANT_AVAILABLE = False


class QdrantProvider(VectorDBProvider):
    """Qdrant implementation of VectorDBProvider."""

    def __init__(self) -> None:
        if not _QDRANT_AVAILABLE:
            raise RuntimeError(
                "qdrant-client is not installed. "
                "Run: pip install 'qdrant-client>=1.7.0'"
            )
        self._client: QdrantClient = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY or None,
            https=settings.QDRANT_HTTPS,
            timeout=15,
        )

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return "Qdrant"

    @property
    def query_language(self) -> str:
        return "json"

    # ── Health ────────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        try:
            self._client.get_collections()
            return True
        except Exception:
            return False

    def get_cluster_status(self) -> Dict[str, Any]:
        version = "unknown"
        try:
            # Try fetching version via the REST root endpoint
            import urllib.request
            scheme = "https" if settings.QDRANT_HTTPS else "http"
            url = f"{scheme}://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}/"
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read())
                version = data.get("version", "unknown")
        except Exception:
            pass

        return {
            "nodes": [
                {
                    "name": f"{settings.QDRANT_HOST}:{settings.QDRANT_PORT}",
                    "version": version,
                    "status": "green" if self.is_ready() else "red",
                }
            ],
            "stats": {"objectCount": 0},
        }

    # ── Schema ────────────────────────────────────────────────────────────────

    def _collection_to_class(self, collection_name: str) -> Dict[str, Any]:
        """Convert a Qdrant collection to the normalised class-schema shape."""
        try:
            info = self._client.get_collection(collection_name)
            # Infer properties from payload schema when available
            properties: List[Dict[str, Any]] = []
            payload_schema = getattr(info, "payload_schema", None) or {}
            for field_name, field_info in payload_schema.items():
                type_str = str(getattr(field_info, "data_type", "")).lower()
                if "int" in type_str:
                    data_type = "int"
                elif "float" in type_str or "double" in type_str:
                    data_type = "number"
                elif "bool" in type_str:
                    data_type = "boolean"
                else:
                    data_type = "text"
                properties.append({"name": field_name, "dataType": [data_type]})

            # Extract vectorizer hint from vector config
            vectorizer = None
            config = getattr(info, "config", None)
            if config:
                params = getattr(config, "params", None)
                if params:
                    size = getattr(params, "size", None)
                    distance = getattr(params, "distance", None)
                    if size:
                        vectorizer = f"dim={size}, distance={distance}"

            return {
                "class": collection_name,
                "description": f"Qdrant collection '{collection_name}'",
                "vectorizer": vectorizer,
                "properties": properties,
                "vectorIndexConfig": None,
                "moduleConfig": None,
            }
        except Exception:
            return {
                "class": collection_name,
                "description": f"Qdrant collection '{collection_name}'",
                "vectorizer": None,
                "properties": [],
                "vectorIndexConfig": None,
                "moduleConfig": None,
            }

    def get_schema(self) -> Dict[str, Any]:
        try:
            collections = self._client.get_collections().collections
            classes = [self._collection_to_class(c.name) for c in collections]
            return {"classes": classes}
        except Exception as exc:
            return {"error": str(exc)}

    def get_class_schema(self, class_name: str) -> Optional[Dict[str, Any]]:
        try:
            return self._collection_to_class(class_name)
        except Exception:
            return None

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _scope_filter(self, project_id: Optional[int]) -> Optional[Any]:
        """Build a Qdrant Filter for the scope field, or None."""
        if project_id is None or not _QDRANT_AVAILABLE:
            return None
        return Filter(
            must=[
                FieldCondition(
                    key=settings.SCOPE_FIELD_NAME,
                    match=MatchValue(value=project_id),
                )
            ]
        )

    @staticmethod
    def _parse_point_id(id_str: str):
        """Return int if the ID is a numeric string, else return as-is (UUID).
        Qdrant only accepts unsigned int or UUID — never a bare numeric string.
        """
        try:
            return int(id_str)
        except (ValueError, TypeError):
            return id_str

    def _point_to_object(self, point: Any) -> Dict[str, Any]:
        """Normalise a Qdrant ScoredPoint / Record to the shared object shape."""
        payload = dict(getattr(point, "payload", {}) or {})
        point_id = str(getattr(point, "id", ""))
        distance = getattr(point, "score", None)
        additional: Dict[str, Any] = {"id": point_id, "creationTimeUnix": 0}
        if distance is not None:
            additional["distance"] = distance
        payload["_additional"] = additional
        return payload

    # ── Data ──────────────────────────────────────────────────────────────────

    def count_objects(
        self, class_name: str, project_id: Optional[int] = None
    ) -> int:
        try:
            filt = self._scope_filter(project_id)
            result = self._client.count(
                collection_name=class_name,
                count_filter=filt,
                exact=True,
            )
            return result.count
        except Exception:
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
        try:
            filt = self._scope_filter(project_id)
            records, _next = self._client.scroll(
                collection_name=class_name,
                scroll_filter=filt,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            objects = [self._point_to_object(r) for r in records]
            return {"data": {"Get": {class_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}

    def get_object(
        self, uuid: str, class_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if class_name is None:
            return None
        try:
            point_id = self._parse_point_id(uuid)
            results = self._client.retrieve(
                collection_name=class_name,
                ids=[point_id],
                with_payload=True,
                with_vectors=True,
            )
            if not results:
                return None
            pt = results[0]
            payload = dict(getattr(pt, "payload", {}) or {})
            payload["id"] = str(getattr(pt, "id", uuid))
            payload["vector"] = getattr(pt, "vector", None)
            payload["class"] = class_name
            return payload
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
        try:
            # Step 1: retrieve source vector
            point_id = self._parse_point_id(object_id)
            src = self._client.retrieve(
                collection_name=class_name,
                ids=[point_id],
                with_vectors=True,
            )
            if not src:
                return {"error": f"Object '{object_id}' not found"}
            vector = getattr(src[0], "vector", None)
            if vector is None:
                return {"error": "Source object has no vector stored"}

            # Step 2: nearest-neighbour search
            # NOTE: qdrant-client >= 1.13 removed search(); use query_points()
            filt = self._scope_filter(project_id)
            result = self._client.query_points(
                collection_name=class_name,
                query=vector,
                query_filter=filt,
                limit=limit + 1,  # +1 to exclude the source itself
                with_payload=True,
                with_vectors=False,
            )
            objects = [
                self._point_to_object(h)
                for h in result.points
                if str(h.id) != str(object_id)
            ][:limit]
            return {"data": {"Get": {class_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}

    # ── Query ─────────────────────────────────────────────────────────────────

    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Accept a JSON filter payload.

        Minimal example:
          {"collection": "Products", "limit": 10}

        With filter:
          {
            "collection": "Products",
            "filter": {
              "must": [{"key": "category", "match": {"value": "Electronics"}}]
            },
            "limit": 10
          }
        """
        try:
            payload = json.loads(query.strip())
        except json.JSONDecodeError:
            return {
                "error": (
                    "Qdrant expects a JSON query. Example:\n"
                    '{"collection": "Products", '
                    '"filter": {"must": [{"key": "category", "match": {"value": "Electronics"}}]}, '
                    '"limit": 10}'
                )
            }

        collection = payload.get("collection")
        if not collection:
            return {"error": "JSON query must contain a 'collection' key."}

        try:
            raw_filter = payload.get("filter")
            limit = int(payload.get("limit", 10))
            qdrant_filter = Filter(**raw_filter) if isinstance(raw_filter, dict) else None

            records, _ = self._client.scroll(
                collection_name=collection,
                scroll_filter=qdrant_filter,
                limit=limit,
                with_payload=True,
            )
            objects = [self._point_to_object(r) for r in records]
            return {"data": {"Get": {collection: objects}}}
        except Exception as exc:
            return {"error": str(exc)}
