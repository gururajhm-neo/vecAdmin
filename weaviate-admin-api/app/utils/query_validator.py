import re
from typing import Optional


def is_read_only_query(query: str) -> bool:
    """
    Validate that GraphQL query is read-only (no mutations).
    Returns True if query is safe to execute.
    """
    # Convert to lowercase for checking
    query_lower = query.lower()
    
    # Check for mutation keywords
    mutation_keywords = [
        "mutation",
        "delete",
        "create",
        "update",
        "add",
        "remove"
    ]
    
    for keyword in mutation_keywords:
        if keyword in query_lower:
            return False
    
    # Check for allowed read operations
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


def sanitize_query(query: str) -> str:
    """
    Sanitize query string.
    Remove excessive whitespace and normalize formatting.
    """
    # Remove comments
    query = re.sub(r'#.*$', '', query, flags=re.MULTILINE)
    
    # Normalize whitespace
    query = ' '.join(query.split())
    
    return query

