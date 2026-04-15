from fastapi import APIRouter, Depends, HTTPException
import time
from app.models.query import QueryExecuteRequest, QueryExecuteResponse
from app.services.weaviate_service import weaviate_service
from app.middleware.auth import get_current_user
from app.utils.query_validator import validate_query_syntax, sanitize_query
from app.providers import get_provider

router = APIRouter()


@router.post("/execute", response_model=QueryExecuteResponse)
async def execute_query(
    request: QueryExecuteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute a native query against the active vector database.
    For Weaviate: GraphQL (read-only).  For Qdrant/ChromaDB: JSON filter.
    Requires authentication.
    """
    try:
        query = sanitize_query(request.query)

        # Only apply the GraphQL validator for Weaviate — other providers
        # use JSON and would be incorrectly rejected.
        provider = get_provider()
        if provider.query_language == "graphql":
            validation_error = validate_query_syntax(query)
            if validation_error:
                return QueryExecuteResponse(
                    error=validation_error,
                    execution_time_ms=0
                )

        start_time = time.time()
        result = weaviate_service.execute_query(query)
        execution_time = (time.time() - start_time) * 1000

        if "error" in result:
            return QueryExecuteResponse(
                error=result["error"],
                execution_time_ms=execution_time
            )

        if "errors" in result:
            error_messages = [err.get("message", "Unknown error") for err in result["errors"]]
            return QueryExecuteResponse(
                error="; ".join(error_messages),
                execution_time_ms=execution_time
            )

        return QueryExecuteResponse(
            data=result,
            execution_time_ms=round(execution_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")


