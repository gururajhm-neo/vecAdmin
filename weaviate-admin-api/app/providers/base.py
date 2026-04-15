"""
Abstract base class that every vector-database provider must implement.

The contract is intentionally shaped to match the existing Weaviate response
schema so all providers normalise their native responses into this common
shape — the REST routes and React frontend stay untouched.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class VectorDBProvider(ABC):
    """Protocol that every supported vector database must satisfy."""

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable name, e.g. 'Weaviate', 'Qdrant', 'ChromaDB'."""

    @property
    @abstractmethod
    def query_language(self) -> str:
        """
        Query-language hint for the frontend editor.
        Known values: 'graphql'  (Weaviate)
                      'json'     (Qdrant / ChromaDB filter DSL)
        """

    # ── Health ────────────────────────────────────────────────────────────────

    @abstractmethod
    def is_ready(self) -> bool:
        """Return True if the database is reachable and healthy."""

    @abstractmethod
    def get_cluster_status(self) -> Dict[str, Any]:
        """
        Return a normalised cluster/node status dict:
        {
          "nodes": [{"name": str, "version": str, "status": str}],
          "stats":  {"objectCount": int}
        }
        """

    # ── Schema ────────────────────────────────────────────────────────────────

    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """
        Return normalised schema:
        {
          "classes": [
            {
              "class":       str,
              "description": str | None,
              "vectorizer":  str | None,
              "properties":  [{"name": str, "dataType": [str]}],
              "vectorIndexConfig": dict | None,
              "moduleConfig":      dict | None,
            }
          ]
        }
        """

    @abstractmethod
    def get_class_schema(self, class_name: str) -> Optional[Dict[str, Any]]:
        """Return one class dict (same shape as classes[] element) or None."""

    # ── Data ──────────────────────────────────────────────────────────────────

    @abstractmethod
    def count_objects(
        self, class_name: str, project_id: Optional[int] = None
    ) -> int:
        """Count objects, optionally filtered by the configured scope field."""

    @abstractmethod
    def query_objects(
        self,
        class_name: str,
        limit: int = 50,
        offset: int = 0,
        properties: Optional[List[str]] = None,
        search_text: Optional[str] = None,
        project_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Paginated object list.
        Returns: {"data": {"Get": {class_name: [object_dict, ...]}}}
        Each object_dict contains the requested properties plus
        "_additional": {"id": str, "creationTimeUnix": int}
        """

    @abstractmethod
    def get_object(
        self, uuid: str, class_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Fetch a single object by UUID / point-ID."""

    @abstractmethod
    def find_similar(
        self,
        class_name: str,
        object_id: str,
        limit: int = 5,
        properties: Optional[List[str]] = None,
        project_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Nearest-neighbour search.
        Returns: {"data": {"Get": {class_name: [object_dict, ...]}}}
        Each object_dict includes "_additional": {"id": str, "distance": float}
        """

    # ── Query ─────────────────────────────────────────────────────────────────

    @abstractmethod
    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a raw provider-native query (GraphQL, JSON filter, etc.).
        Errors must be returned as {"error": str}, not raised as exceptions.
        """
