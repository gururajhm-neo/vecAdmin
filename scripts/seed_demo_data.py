#!/usr/bin/env python3
"""
seed_demo_data.py — Populate VecAdmin with sample data for first-time setup.

Creates three collections (Products · Articles · Users) with realistic demo
records so you can explore the UI immediately without pointing at a real DB.

Supports: FAISS · Qdrant · ChromaDB · Weaviate
Usage:
    cd weaviate-admin-api
    source venv/bin/activate
    python3 ../scripts/seed_demo_data.py            # uses .env DB_PROVIDER
    python3 ../scripts/seed_demo_data.py --provider faiss
    python3 ../scripts/seed_demo_data.py --provider qdrant
    python3 ../scripts/seed_demo_data.py --provider chroma
    python3 ../scripts/seed_demo_data.py --provider weaviate
"""

import argparse
import os
import sys
import uuid
import random
import json

# ── Sample data ───────────────────────────────────────────────────────────────

PRODUCTS = [
    {"name": "Wireless Noise-Cancelling Headphones", "category": "Electronics",  "price": 89.99,  "in_stock": True},
    {"name": "Mechanical Keyboard (Tenkeyless)",      "category": "Electronics",  "price": 129.99, "in_stock": True},
    {"name": "USB-C Hub 7-in-1",                      "category": "Electronics",  "price": 39.99,  "in_stock": True},
    {"name": "27-inch 4K Monitor",                    "category": "Electronics",  "price": 349.99, "in_stock": False},
    {"name": "Ergonomic Laptop Stand",                "category": "Electronics",  "price": 49.99,  "in_stock": True},
    {"name": "Clean Code (book)",                     "category": "Books",        "price": 34.99,  "in_stock": True},
    {"name": "Designing Data-Intensive Apps",         "category": "Books",        "price": 44.99,  "in_stock": True},
    {"name": "The Pragmatic Programmer",              "category": "Books",        "price": 39.99,  "in_stock": False},
    {"name": "Python Crash Course",                   "category": "Books",        "price": 29.99,  "in_stock": True},
    {"name": "System Design Interview",               "category": "Books",        "price": 32.99,  "in_stock": True},
    {"name": "Running Shoes (Trail)",                 "category": "Clothing",     "price": 109.99, "in_stock": True},
    {"name": "Merino Wool T-Shirt",                   "category": "Clothing",     "price": 45.99,  "in_stock": True},
    {"name": "Waterproof Jacket",                     "category": "Clothing",     "price": 149.99, "in_stock": False},
    {"name": "Athletic Shorts",                       "category": "Clothing",     "price": 29.99,  "in_stock": True},
    {"name": "Compression Socks",                     "category": "Clothing",     "price": 14.99,  "in_stock": True},
    {"name": "Standing Desk Mat",                     "category": "Electronics",  "price": 59.99,  "in_stock": True},
    {"name": "Portable SSD 1TB",                      "category": "Electronics",  "price": 99.99,  "in_stock": True},
    {"name": "Webcam 1080p",                          "category": "Electronics",  "price": 69.99,  "in_stock": False},
    {"name": "Desk Lamp LED",                         "category": "Electronics",  "price": 34.99,  "in_stock": True},
    {"name": "Cable Management Kit",                  "category": "Electronics",  "price": 19.99,  "in_stock": True},
]

ARTICLES = [
    {"title": "Introduction to Vector Databases",          "topic": "AI",            "author": "Alice Chen",    "views": 4821},
    {"title": "Weaviate vs Qdrant: A Practical Comparison","topic": "AI",            "author": "Bob Martinez",  "views": 3102},
    {"title": "Building RAG Pipelines with LLMs",          "topic": "AI",            "author": "Carol Singh",   "views": 6540},
    {"title": "FAISS: Fast Approximate Nearest Neighbors", "topic": "AI",            "author": "David Park",    "views": 2891},
    {"title": "ChromaDB for Local Development",            "topic": "AI",            "author": "Eva Liu",       "views": 1743},
    {"title": "FastAPI Best Practices 2025",               "topic": "Backend",       "author": "Frank Okafor",  "views": 5210},
    {"title": "Async Python with asyncio",                 "topic": "Backend",       "author": "Grace Kim",     "views": 3880},
    {"title": "Designing REST APIs That Scale",            "topic": "Backend",       "author": "Henry Torres",  "views": 4420},
    {"title": "PostgreSQL vs MongoDB for Time Series",     "topic": "Backend",       "author": "Iris Nakamura", "views": 2310},
    {"title": "JWT Authentication Deep Dive",              "topic": "Backend",       "author": "James Obi",     "views": 3670},
    {"title": "React 19 New Features",                     "topic": "Frontend",      "author": "Karen Lee",     "views": 7820},
    {"title": "TypeScript Generics Explained",             "topic": "Frontend",      "author": "Leo Fischer",   "views": 5140},
    {"title": "State Management in 2025",                  "topic": "Frontend",      "author": "Maya Patel",    "views": 4290},
    {"title": "CSS Container Queries Guide",               "topic": "Frontend",      "author": "Nathan Brooks", "views": 2760},
    {"title": "Accessibility in Modern Web Apps",          "topic": "Frontend",      "author": "Olivia Wang",   "views": 1980},
]

USERS = [
    {"name": "Alice Chen",    "email": "alice@example.com",   "role": "admin",    "active": True,  "department": "Engineering"},
    {"name": "Bob Martinez",  "email": "bob@example.com",     "role": "engineer", "active": True,  "department": "Engineering"},
    {"name": "Carol Singh",   "email": "carol@example.com",   "role": "engineer", "active": True,  "department": "Data Science"},
    {"name": "David Park",    "email": "david@example.com",   "role": "analyst",  "active": False, "department": "Data Science"},
    {"name": "Eva Liu",       "email": "eva@example.com",     "role": "engineer", "active": True,  "department": "ML Platform"},
    {"name": "Frank Okafor",  "email": "frank@example.com",   "role": "engineer", "active": True,  "department": "Backend"},
    {"name": "Grace Kim",     "email": "grace@example.com",   "role": "admin",    "active": True,  "department": "Engineering"},
    {"name": "Henry Torres",  "email": "henry@example.com",   "role": "analyst",  "active": True,  "department": "Product"},
    {"name": "Iris Nakamura", "email": "iris@example.com",    "role": "engineer", "active": False, "department": "Backend"},
    {"name": "James Obi",     "email": "james@example.com",   "role": "engineer", "active": True,  "department": "Security"},
]

COLLECTIONS = {
    "Products": PRODUCTS,
    "Articles": ARTICLES,
    "Users":    USERS,
}

DIM = 128  # vector dimension for providers that need one

def _random_vector(dim: int = DIM) -> list:
    """Return a random L2-normalised unit vector.

    Using unit vectors ensures that squared-L2 distance is equivalent to
    2*(1 - cosine_similarity), giving similarity scores in a meaningful range.
    """
    import math
    v = [random.gauss(0, 1) for _ in range(dim)]
    norm = math.sqrt(sum(x * x for x in v)) or 1.0
    return [round(x / norm, 6) for x in v]


# ── Provider seeders ──────────────────────────────────────────────────────────

def seed_faiss(index_dir: str):
    try:
        import faiss
        import numpy as np
    except ImportError:
        print("  ✗ faiss-cpu not installed. Run: pip install faiss-cpu")
        sys.exit(1)
    import json, os

    os.makedirs(index_dir, exist_ok=True)
    for col_name, records in COLLECTIONS.items():
        col_dir = os.path.join(index_dir, col_name)
        os.makedirs(col_dir, exist_ok=True)
        index = faiss.IndexFlatL2(DIM)
        vectors = np.array([_random_vector() for _ in records], dtype="float32")
        index.add(vectors)
        faiss.write_index(index, os.path.join(col_dir, "index.faiss"))
        meta = [{"id": str(uuid.uuid4()), **r} for r in records]
        with open(os.path.join(col_dir, "metadata.json"), "w") as f:
            json.dump(meta, f, indent=2)
        print(f"  ✓ {col_name}: {len(records)} objects")


def seed_qdrant(host: str, port: int):
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams, PointStruct
    except ImportError:
        print("  ✗ qdrant-client not installed. Run: pip install qdrant-client")
        sys.exit(1)

    client = QdrantClient(host=host, port=port)
    for col_name, records in COLLECTIONS.items():
        try:
            client.delete_collection(col_name)
        except Exception:
            pass
        client.create_collection(
            col_name,
            vectors_config=VectorParams(size=DIM, distance=Distance.COSINE),
        )
        points = [
            PointStruct(
                id=i,
                vector=_random_vector(),
                payload=record,
            )
            for i, record in enumerate(records)
        ]
        client.upsert(col_name, points)
        print(f"  ✓ {col_name}: {len(records)} objects")


def seed_chroma(host: str, port: int):
    try:
        import chromadb
    except ImportError:
        print("  ✗ chromadb not installed. Run: pip install chromadb")
        sys.exit(1)

    client = chromadb.HttpClient(host=host, port=port)
    for col_name, records in COLLECTIONS.items():
        try:
            client.delete_collection(col_name)
        except Exception:
            pass
        col = client.create_collection(col_name)
        ids       = [str(i) for i in range(len(records))]
        documents = [json.dumps(r) for r in records]
        col.add(ids=ids, documents=documents, metadatas=records)
        print(f"  ✓ {col_name}: {len(records)} objects")


def seed_weaviate(url: str):
    try:
        import weaviate
    except ImportError:
        print("  ✗ weaviate-client not installed. Run: pip install weaviate-client")
        sys.exit(1)

    client = weaviate.Client(url)

    SCHEMAS = {
        "Products": [
            {"name": "name",      "dataType": ["text"]},
            {"name": "category",  "dataType": ["text"]},
            {"name": "price",     "dataType": ["number"]},
            {"name": "in_stock",  "dataType": ["boolean"]},
        ],
        "Articles": [
            {"name": "title",   "dataType": ["text"]},
            {"name": "topic",   "dataType": ["text"]},
            {"name": "author",  "dataType": ["text"]},
            {"name": "views",   "dataType": ["int"]},
        ],
        "Users": [
            {"name": "name",        "dataType": ["text"]},
            {"name": "email",       "dataType": ["text"]},
            {"name": "role",        "dataType": ["text"]},
            {"name": "active",      "dataType": ["boolean"]},
            {"name": "department",  "dataType": ["text"]},
        ],
    }

    for col_name, records in COLLECTIONS.items():
        try:
            client.schema.delete_class(col_name)
        except Exception:
            pass
        client.schema.create_class({
            "class": col_name,
            "properties": SCHEMAS[col_name],
            "vectorizer": "none",
        })
        with client.batch as batch:
            batch.batch_size = 50
            for record in records:
                batch.add_data_object(record, col_name, vector=_random_vector())
        print(f"  ✓ {col_name}: {len(records)} objects")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed VecAdmin demo data")
    parser.add_argument("--provider", help="Override DB_PROVIDER (faiss|qdrant|chroma|weaviate)")
    args = parser.parse_args()

    # Load .env if present (simple parser, no dotenv dependency)
    env_path = os.path.join(os.path.dirname(__file__), "..", "weaviate-admin-api", ".env")
    env = {}
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    env[k.strip()] = v.strip()

    provider = args.provider or env.get("DB_PROVIDER", "faiss")
    print(f"\n🌱  Seeding demo data → provider: {provider.upper()}\n")

    if provider == "faiss":
        index_dir = env.get("FAISS_INDEX_DIR", "./faiss_data")
        if not os.path.isabs(index_dir):
            index_dir = os.path.join(
                os.path.dirname(__file__), "..", "weaviate-admin-api", index_dir
            )
        seed_faiss(index_dir)

    elif provider == "qdrant":
        host = env.get("QDRANT_HOST", "localhost")
        port = int(env.get("QDRANT_PORT", 6333))
        seed_qdrant(host, port)

    elif provider in ("chroma", "chromadb"):
        host = env.get("CHROMA_HOST", "localhost")
        port = int(env.get("CHROMA_PORT", 8001))
        seed_chroma(host, port)

    elif provider == "weaviate":
        url = env.get("WEAVIATE_URL", "http://localhost:8080")
        seed_weaviate(url)

    else:
        print(f"Unknown provider: {provider}")
        sys.exit(1)

    print(f"\n✅  Done! Open http://localhost:3000 and log in with:")
    print("    engineer1@example.com  /  admin123")
    print("    (or whatever credentials are set in AUTH_USERS_JSON)\n")


if __name__ == "__main__":
    main()
