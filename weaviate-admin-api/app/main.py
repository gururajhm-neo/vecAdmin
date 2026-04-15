from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import auth, dashboard, schema, data, query, projects, provider

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
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
app.include_router(auth.router,     prefix=f"{settings.API_V1_PREFIX}/auth",     tags=["Authentication"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(schema.router,   prefix=f"{settings.API_V1_PREFIX}/schema",   tags=["Schema"])
app.include_router(data.router,     prefix=f"{settings.API_V1_PREFIX}/data",     tags=["Data"])
app.include_router(query.router,    prefix=f"{settings.API_V1_PREFIX}/query",    tags=["Query"])
app.include_router(projects.router, prefix=f"{settings.API_V1_PREFIX}/projects", tags=["Projects"])
app.include_router(provider.router, prefix=f"{settings.API_V1_PREFIX}/provider", tags=["Provider"])


@app.on_event("startup")
async def _log_provider():
    """Log which vector-DB provider is active at startup."""
    from app.providers import get_provider
    try:
        p = get_provider()
        ready = p.is_ready()
        print(
            f"\n{'='*55}\n"
            f"  VecAdmin API  v{settings.APP_VERSION}\n"
            f"  Provider : {p.provider_name}\n"
            f"  Language : {p.query_language}\n"
            f"  Status   : {'✅ connected' if ready else '⚠️  not reachable'}\n"
            f"{'='*55}\n"
        )
    except Exception as exc:
        print(f"[startup] Provider init warning: {exc}")


@app.get("/")
async def root():
    return {
        "name":     settings.APP_NAME,
        "version":  settings.APP_VERSION,
        "provider": settings.DB_PROVIDER,
        "status":   "healthy",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


