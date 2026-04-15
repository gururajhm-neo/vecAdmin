import re
from typing import Optional


def is_read_only_query(query: str) -> bool:
    """
    Validate that GraphQL query is read-only (no mutations).
    Returns True if query is safe to execute.
    Uses word-boundary matching so field names like _additional are not
    mistakenly flagged by the substring 'add'.
    """
    query_lower = query.lower()

    # Match whole words only (e.g. "add" must not be inside "_additional")
    mutation_pattern = re.compile(
        r'\b(mutation|delete|create|update|remove)\b'
    )
    if mutation_pattern.search(query_lower):
        return False

    # Must contain at least one recognised read root operation
    read_keywords = ["get", "aggregate", "explore"]
    has_read_operation = any(keyword in query_lower for keyword in read_keywords)

    return has_read_operation


def validate_query_syntax(query: str) -> Optional[str]:
    """
    Basic validation of GraphQL query syntax.
    Returns error message if invalid, None if valid.
    """
    if not query or not query.strip():
        return "Query cannot be empty"
    
    # Check for balanced braces
    if query.count("{") != query.count("}"):
        return "Unbalanced braces in query"
    
    # Check if it's a read-only query
    if not is_read_only_query(query):
        return "Only read-only queries are allowed (Get, Aggregate, Explore)"
    
    return None


def sanitize_query(query: str, is_graphql: bool = True) -> str:
    """
    Sanitize query string.
    For GraphQL: strip # comments and normalize whitespace.
    For JSON providers (Qdrant/ChromaDB/FAISS): only normalize whitespace —
    stripping # would corrupt JSON string values that contain the character.
    """
    if is_graphql:
        # Remove GraphQL line comments
        query = re.sub(r'#.*$', '', query, flags=re.MULTILINE)

    # Normalize whitespace (safe for both GraphQL and JSON)
    query = ' '.join(query.split())

    return query

