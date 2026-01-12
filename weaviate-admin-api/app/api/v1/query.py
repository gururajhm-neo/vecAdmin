from fastapi import APIRouter, Depends, HTTPException
import time
from app.models.query import QueryExecuteRequest, QueryExecuteResponse
from app.services.weaviate_service import weaviate_service
from app.middleware.auth import get_current_user
from app.utils.query_validator import validate_query_syntax, sanitize_query

router = APIRouter()


@router.post("/execute", response_model=QueryExecuteResponse)
async def execute_query(
    request: QueryExecuteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute GraphQL query against Weaviate.
    Only read-only queries are allowed.
    Requires authentication.
    """
    try:
        # Sanitize query
        query = sanitize_query(request.query)
        
        # Validate query
        validation_error = validate_query_syntax(query)
        if validation_error:
            return QueryExecuteResponse(
                error=validation_error,
                execution_time_ms=0
            )
        
        # Execute query with timing
        start_time = time.time()
        result = weaviate_service.execute_graphql(query)
        execution_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Check for errors in result
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

