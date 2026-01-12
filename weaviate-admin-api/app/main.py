from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import auth, dashboard, schema, data, query, projects

# Create FastAPI application
app = FastAPI(
    title="Weaviate Admin API",
    description="Internal API for Weaviate Admin Dashboard - TestNeo",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(schema.router, prefix=f"{settings.API_V1_PREFIX}/schema", tags=["Schema"])
app.include_router(data.router, prefix=f"{settings.API_V1_PREFIX}/data", tags=["Data"])
app.include_router(query.router, prefix=f"{settings.API_V1_PREFIX}/query", tags=["Query"])
app.include_router(projects.router, prefix=f"{settings.API_V1_PREFIX}/projects", tags=["Projects"])


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "name": "Weaviate Admin API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

