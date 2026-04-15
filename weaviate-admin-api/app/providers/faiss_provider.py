"""
FAISS (Facebook AI Similarity Search) vector-database provider.

Requires: pip install faiss-cpu   (or faiss-gpu for CUDA support)

This is a *local, file-based* provider — no server required.

Layout on disk
──────────────
  <FAISS_INDEX_DIR>/
    <CollectionName>/
      index.faiss      ← FAISS IndexFlatL2 (supports reconstruct)
      metadata.json    ← list of dicts, one per vector
                         index i in the list == FAISS internal id i
                         each dict: {"id": "<uuid>", ...user metadata...}

Environment variables
─────────────────────
  FAISS_INDEX_DIR   path to the root directory  (default: ./faiss_data)

Query playground JSON format
────────────────────────────
  # Plain paginated list
  {"collection": "Articles", "limit": 10, "offset": 0}

  # ANN (approximate nearest-neighbour) search
  {"collection": "Articles", "query_vector": [0.1, 0.2, ...], "limit": 5}
"""

import json
import os
import uuid as _uuid_module
from typing import Any, Dict, List, Optional

from app.config import settings
from app.providers.base import VectorDBProvider

try:
    import faiss
    import numpy as np
    _FAISS_AVAILABLE = True
except ImportError:
    _FAISS_AVAILABLE = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _collection_dir(name: str) -> str:
    return os.path.join(settings.FAISS_INDEX_DIR, name)

def _index_path(name: str) -> str:
    return os.path.join(_collection_dir(name), "index.faiss")

def _meta_path(name: str) -> str:
    return os.path.join(_collection_dir(name), "metadata.json")

def _load_meta(name: str) -> List[Dict[str, Any]]:
    path = _meta_path(name)
    if not os.path.isfile(path):
        return []
    with open(path, "r") as f:
        return json.load(f)

def _load_index(name: str):
    path = _index_path(name)
    if not os.path.isfile(path):
        return None
    return faiss.read_index(path)

def _collection_names() -> List[str]:
    base = settings.FAISS_INDEX_DIR
    if not os.path.isdir(base):
        return []
    return [
        d for d in os.listdir(base)
        if os.path.isdir(os.path.join(base, d))
        and os.path.isfile(os.path.join(base, d, "metadata.json"))
    ]


# ── Provider ──────────────────────────────────────────────────────────────────

class FAISSProvider(VectorDBProvider):
    """FAISS (local flat-file) implementation of VectorDBProvider."""

    def __init__(self) -> None:
        if not _FAISS_AVAILABLE:
            raise RuntimeError(
                "faiss is not installed. Run: pip install faiss-cpu"
            )
        os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return "FAISS"

    @property
    def query_language(self) -> str:
        return "json"

    # ── Health ────────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        return _FAISS_AVAILABLE and os.path.isdir(settings.FAISS_INDEX_DIR)

    def get_cluster_status(self) -> Dict[str, Any]:
        names = _collection_names()
        total = sum(len(_load_meta(n)) for n in names)
        return {
            "nodes": [
                {
                    "name": f"faiss-local ({settings.FAISS_INDEX_DIR})",
                    "version": getattr(faiss, "__version__", "unknown"),
                    "status": "green" if self.is_ready() else "red",
                }
            ],
            "stats": {"objectCount": total},
        }

    # ── Schema ────────────────────────────────────────────────────────────────

    def _infer_properties(self, name: str) -> List[Dict[str, Any]]:
        meta = _load_meta(name)
        if not meta:
            return []
        sample = meta[0]
        # Read cross-reference hints written by the seed script
        xrefs: Dict[str, str] = {}
        if "_xrefs" in sample:
            try:
                xrefs = json.loads(sample["_xrefs"])
            except Exception:
                pass
        props = []
        for k in sample.keys():
            if k in ("id", "_xrefs"):
                continue
            if k in xrefs:
                # Cross-reference to another class
                props.append({"name": k, "dataType": [xrefs[k]]})
            else:
                props.append({"name": k, "dataType": ["text"]})
        return props

    def _collection_to_class(self, name: str) -> Dict[str, Any]:
        meta = _load_meta(name)
        index = _load_index(name)
        dim = index.d if index is not None else 0
        return {
            "class": name,
            "description": f"FAISS collection '{name}' — {len(meta)} vectors, dim={dim}",
            "vectorizer": "faiss-flatl2",
            "properties": self._infer_properties(name),
            "vectorIndexConfig": {"dimension": dim, "metric": "L2"},
            "moduleConfig": None,
        }

    def get_schema(self) -> Dict[str, Any]:
        names = _collection_names()
        return {"classes": [self._collection_to_class(n) for n in names]}

    def get_class_schema(self, class_name: str) -> Optional[Dict[str, Any]]:
        if not os.path.isdir(_collection_dir(class_name)):
            return None
        return self._collection_to_class(class_name)

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _to_object(
        self, entry: Dict[str, Any], distance: Optional[float] = None
    ) -> Dict[str, Any]:
        obj = {k: v for k, v in entry.items() if k != "id"}
        additional: Dict[str, Any] = {
            "id": entry.get("id", str(_uuid_module.uuid4())),
            "creationTimeUnix": 0,
        }
        if distance is not None:
            additional["distance"] = round(float(distance), 6)
        obj["_additional"] = additional
        return obj

    # ── Data ──────────────────────────────────────────────────────────────────

    def count_objects(
        self, class_name: str, project_id: Optional[int] = None
    ) -> int:
        meta = _load_meta(class_name)
        if project_id is None:
            return len(meta)
        field = settings.SCOPE_FIELD_NAME
        return sum(1 for m in meta if m.get(field) == project_id)

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
            meta = _load_meta(class_name)

            # Optional scope filter
            if project_id is not None:
                field = settings.SCOPE_FIELD_NAME
                meta = [m for m in meta if m.get(field) == project_id]

            # Optional text filter (substring, case-insensitive)
            if search_text:
                q = search_text.lower()
                meta = [
                    m for m in meta
                    if any(q in str(v).lower() for v in m.values())
                ]

            page = meta[offset: offset + limit]
            objects = [self._to_object(m) for m in page]
            return {"data": {"Get": {class_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}

    def get_object(
        self, uuid: str, class_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if class_name is None:
            # Search across all collections
            for name in _collection_names():
                result = self.get_object(uuid, class_name=name)
                if result:
                    return result
            return None

        meta = _load_meta(class_name)
        for i, m in enumerate(meta):
            if m.get("id") == uuid:
                obj = dict(m)
                # Attempt to attach the stored vector
                try:
                    index = _load_index(class_name)
                    if index is not None:
                        vec = index.reconstruct(i)
                        obj["vector"] = vec.tolist()
                except Exception:
                    pass
                obj["class"] = class_name
                return obj
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
            meta = _load_meta(class_name)
            index = _load_index(class_name)
            if index is None:
                return {"error": f"No FAISS index found for '{class_name}'"}

            # Find position of source object
            src_pos = next(
                (i for i, m in enumerate(meta) if m.get("id") == object_id), None
            )
            if src_pos is None:
                return {"error": f"Object '{object_id}' not found in '{class_name}'"}

            query_vec = np.array(
                [index.reconstruct(src_pos)], dtype=np.float32
            )
            k = min(limit + 1, index.ntotal)
            distances, indices = index.search(query_vec, k)

            # Collect raw (dist, entry) pairs, excluding the query itself
            raw: list = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx == src_pos or idx < 0:
                    continue
                entry = meta[idx] if idx < len(meta) else {}
                raw.append((float(dist), entry))
                if len(raw) >= limit:
                    break

            # Normalize distances to [0, 1] within this result set so the UI
            # shows meaningful spread (closest → ~100%, farthest → ~0%)
            # regardless of absolute distance scale (L2, squared-L2, etc.)
            if raw:
                min_d = raw[0][0]          # already sorted ascending by FAISS
                max_d = raw[-1][0]
                d_range = max_d - min_d
                objects = [
                    self._to_object(
                        entry,
                        distance=(d - min_d) / d_range if d_range > 1e-9 else 0.0,
                    )
                    for d, entry in raw
                ]
            else:
                objects = []

            return {"data": {"Get": {class_name: objects}}}
        except Exception as exc:
            return {"error": str(exc)}

    # ── Query ─────────────────────────────────────────────────────────────────

    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Accept a JSON query payload.

        Plain list (paginated):
          {"collection": "Articles", "limit": 10, "offset": 0}

        ANN vector search:
          {"collection": "Articles", "query_vector": [0.1, 0.2, ...], "limit": 5}
        """
        try:
            payload = json.loads(query.strip())
        except json.JSONDecodeError:
            return {
                "error": (
                    "FAISS expects a JSON query. Example:\n"
                    '{"collection": "Articles", "limit": 10}\n'
                    'or for ANN:\n'
                    '{"collection": "Articles", "query_vector": [0.1, 0.2, ...], "limit": 5}'
                )
            }

        collection_name = payload.get("collection")
        if not collection_name:
            return {"error": "JSON query must contain a 'collection' key."}

        limit = int(payload.get("limit", 10))
        offset = int(payload.get("offset", 0))
        query_vector = payload.get("query_vector")

        try:
            if query_vector is not None:
                # ── ANN search mode ──────────────────────────────────────────
                index = _load_index(collection_name)
                if index is None:
                    return {"error": f"No FAISS index found for '{collection_name}'"}
                meta = _load_meta(collection_name)

                qv = np.array([query_vector], dtype=np.float32)
                k = min(limit, index.ntotal)
                distances, indices = index.search(qv, k)

                objects = []
                for dist, idx in zip(distances[0], indices[0]):
                    if idx < 0:
                        continue
                    entry = meta[idx] if idx < len(meta) else {}
                    objects.append(self._to_object(entry, distance=dist))

                return {"data": {"Get": {collection_name: objects}}}

            else:
                # ── Plain list mode ──────────────────────────────────────────
                meta = _load_meta(collection_name)
                page = meta[offset: offset + limit]
                objects = [self._to_object(m) for m in page]
                return {"data": {"Get": {collection_name: objects}}}

        except Exception as exc:
            return {"error": str(exc)}
