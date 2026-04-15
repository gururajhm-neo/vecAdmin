"""
ChromaDB vector-database provider.

Requires: pip install "chromadb>=0.4.0"

Normalises ChromaDB collections/documents into the shared VectorDBProvider
schema so the existing REST routes and React UI work without modification.
"""

import json
from typing import Any, Dict, List, Optional

from app.config import settings
from app.providers.base import VectorDBProvider

try:
    import chromadb
    _CHROMA_AVAILABLE = True
except ImportError:
    _CHROMA_AVAILABLE = False


class ChromaProvider(VectorDBProvider):
    """ChromaDB implementation of VectorDBProvider."""

    def __init__(self) -> None:
        if not _CHROMA_AVAILABLE:
            raise RuntimeError(
                "chromadb is not installed. Run: pip install 'chromadb>=0.4.0'"
            )
        self._client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            tenant=settings.CHROMA_TENANT,
            database=settings.CHROMA_DATABASE,
        )

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return "ChromaDB"

    @property
    def query_language(self) -> str:
        return "json"

    # ── Health ────────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        try:
            self._client.heartbeat()
            return True
        except Exception:
            return False

    def get_cluster_status(self) -> Dict[str, Any]:
        version = "unknown"
        try:
            version = self._client.get_version()
        except Exception:
            pass
        return {
            "nodes": [
                {
                    "name": f"{settings.CHROMA_HOST}:{settings.CHROMA_PORT}",
                    "version": version,
                    "status": "green" if self.is_ready() else "red",
                }
            ],
            "stats": {"objectCount": 0},
        }

    # ── Schema ────────────────────────────────────────────────────────────────

    def _infer_properties(self, collection: Any) -> List[Dict[str, Any]]:
        """Sample a document to infer metadata keys as properties."""
        try:
            result = collection.peek(limit=1)
            if result and result.get("metadatas"):
                meta = result["metadatas"][0] or {}
                # Read cross-reference hints written by the seed script
                xrefs: Dict[str, str] = {}
                if "_xrefs" in meta:
                    try:
                        xrefs = json.loads(meta["_xrefs"])
                    except Exception:
                        pass
                props = []
                for k in meta.keys():
                    if k == "_xrefs":
                        continue
                    if k in xrefs:
                        props.append({"name": k, "dataType": [xrefs[k]]})
                    else:
                        props.append({"name": k, "dataType": ["text"]})
                return props
        except Exception:
            pass
        return []

    def _collection_to_class(self, col: Any) -> Dict[str, Any]:
        properties = self._infer_properties(col)
        meta = col.metadata or {}
        return {
            "class": col.name,
            "description": meta.get("description", f"ChromaDB collection '{col.name}'"),
            "vectorizer": meta.get("embedding_function", None),
            "properties": properties,
            "vectorIndexConfig": None,
            "moduleConfig": None,
        }

    def get_schema(self) -> Dict[str, Any]:
        try:
            collections = self._client.list_collections()
            classes = [self._collection_to_class(c) for c in collections]
            return {"classes": classes}
        except Exception as exc:
            return {"error": str(exc)}

    def get_class_schema(self, class_name: str) -> Optional[Dict[str, Any]]:
        try:
            col = self._client.get_collection(class_name)
            return self._collection_to_class(col)
        except Exception:
            return None

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _to_object(
        self,
        doc_id: str,
        document: Optional[str],
        metadata: Optional[Dict],
        distance: Optional[float] = None,
    ) -> Dict[str, Any]:
        obj: Dict[str, Any] = dict(metadata or {})
        if document is not None:
            obj["document"] = document
        additional: Dict[str, Any] = {"id": doc_id, "creationTimeUnix": 0}
        if distance is not None:
            additional["distance"] = distance
        obj["_additional"] = additional
        return obj

    # ── Data ──────────────────────────────────────────────────────────────────

    def count_objects(
        self, class_name: str, project_id: Optional[int] = None
    ) -> int:
        try:
            col = self._client.get_collection(class_name)
            return col.count()
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
            col = self._client.get_collection(class_name)
            where: Optional[Dict] = None
            if project_id is not None:
                where = {settings.SCOPE_FIELD_NAME: {"$eq": project_id}}

            kwargs: Dict[str, Any] = {
                "limit": limit,
                "offset": offset,
                "include": ["documents", "metadatas"],
            }
            if where:
                kwargs["where"] = where

            result = col.get(**kwargs)
            ids = result.get("ids", [])
            docs = result.get("documents") or [None] * len(ids)
            metas = result.get("metadatas") or [None] * len(ids)

            objects = [
                self._to_object(ids[i], docs[i], metas[i])
                for i in range(len(ids))
            ]
            return {"data": {"Get": {class_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}

    def get_object(
        self, uuid: str, class_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if class_name is None:
            return None
        try:
            col = self._client.get_collection(class_name)
            result = col.get(
                ids=[uuid],
                include=["documents", "metadatas", "embeddings"],
            )
            if not result.get("ids"):
                return None
            obj = dict((result.get("metadatas") or [{}])[0] or {})
            docs = result.get("documents") or []
            # chromadb >=1.0 returns embeddings as numpy.ndarray — avoid `or []`
            raw_embs = result.get("embeddings")
            embs = [] if raw_embs is None else raw_embs
            if docs:
                obj["document"] = docs[0]
            if len(embs) > 0 and embs[0] is not None:
                vec = embs[0]
                obj["vector"] = vec.tolist() if hasattr(vec, "tolist") else list(vec)
            obj["id"] = uuid
            obj["class"] = class_name
            return obj
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
            col = self._client.get_collection(class_name)
            # Step 1: retrieve source embedding
            src = col.get(ids=[object_id], include=["embeddings"])
            if not src.get("ids"):
                return {"error": f"Object '{object_id}' not found"}
            # chromadb >=1.0 returns embeddings as numpy.ndarray — avoid `or []`
            raw_emb = src.get("embeddings")
            embeddings = [] if raw_emb is None else raw_emb
            if len(embeddings) == 0 or embeddings[0] is None:
                return {"error": "Source object has no embedding stored"}

            where: Optional[Dict] = None
            if project_id is not None:
                where = {settings.SCOPE_FIELD_NAME: {"$eq": project_id}}

            kwargs: Dict[str, Any] = {
                "query_embeddings": [embeddings[0]],
                "n_results": limit + 1,
                "include": ["documents", "metadatas", "distances"],
            }
            if where:
                kwargs["where"] = where

            # Step 2: nearest-neighbour query
            result = col.query(**kwargs)
            ids = result["ids"][0]
            docs = (result.get("documents") or [[]])[0]
            metas = (result.get("metadatas") or [[]])[0]
            dists = (result.get("distances") or [[]])[0]

            # Filter self, keep up to limit
            raw = [
                (ids[i], docs[i] if docs else None, metas[i] if metas else None, float(dists[i]) if dists else 0.0)
                for i in range(len(ids))
                if ids[i] != object_id
            ][:limit]

            # Normalize distances within result set → [0,1] (closest=0, farthest=1)
            # so the UI formula (1-d)*100 gives a meaningful 0-100% spread
            if raw:
                raw_dists = [r[3] for r in raw]
                min_d, max_d = min(raw_dists), max(raw_dists)
                d_range = max_d - min_d

            objects = [
                self._to_object(
                    r[0], r[1], r[2],
                    distance=(r[3] - min_d) / d_range if (raw and d_range > 1e-9) else 0.0,
                )
                for r in raw
            ][:limit]
            return {"data": {"Get": {class_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}

    # ── Query ─────────────────────────────────────────────────────────────────

    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Accept a JSON query payload.

        Minimal example:
          {"collection": "Articles", "limit": 10}

        With filter:
          {
            "collection": "Articles",
            "where": {"category": {"$eq": "tech"}},
            "limit": 10
          }
        """
        try:
            payload = json.loads(query.strip())
        except json.JSONDecodeError:
            return {
                "error": (
                    "ChromaDB expects a JSON query. Example:\n"
                    '{"collection": "Articles", '
                    '"where": {"category": {"$eq": "tech"}}, "limit": 10}'
                )
            }

        collection_name = payload.get("collection")
        if not collection_name:
            return {"error": "JSON query must contain a 'collection' key."}

        try:
            col = self._client.get_collection(collection_name)
            where = payload.get("where")
            limit = int(payload.get("limit", 10))

            kwargs: Dict[str, Any] = {
                "limit": limit,
                "include": ["documents", "metadatas"],
            }
            if where:
                kwargs["where"] = where

            result = col.get(**kwargs)
            ids = result.get("ids", [])
            docs = result.get("documents") or [None] * len(ids)
            metas = result.get("metadatas") or [None] * len(ids)

            objects = [
                self._to_object(ids[i], docs[i], metas[i])
                for i in range(len(ids))
            ]
            return {"data": {"Get": {collection_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}
