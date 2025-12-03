"""
Main FastAPI Application
Entry point for the NI DAQ Web Service
"""
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.core.config import settings
from app.api.routes import api_router


def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Mount static files directory
    static_path = Path(__file__).parent.parent / "static"
    if static_path.exists():
        app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
    
    # Include all API routes
    app.include_router(api_router)
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with API information"""
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "total_relays": "56 relays across 6 modules (ZS1, ZS2, ZK1, ZK2, ZK3, ZK4)",
            "endpoints": {
                "docs": "/docs",
                "redoc": "/redoc",
                "dashboard": "/dashboard",
                "devices": "/api/devices",
                "all_relays": "/api/relays",
                "relays_by_module": "/api/relays/module/{module_name}",
                "relay_states": "/api/relays/states",
                "control_relay": "/api/relay/{relay_name}/{state}",
                "control_multiple_relays": "/api/relays/multiple",
                "disable_all_relays": "/api/relays/disable-all",
                "disable_enabled_relays": "/api/relays/disable-enabled",
                "start_read_adc": "/api/start-read-adc",
                "stop_read_adc": "/api/stop-read-adc",
                "adc_status": "/api/adc-status",
                "discharge_capacitor": "/api/discharge-capacitor",
                "websocket": "/ws/daq"
            }
        }
    
    # Dashboard endpoint
    @app.get("/dashboard", response_class=HTMLResponse)
    async def dashboard():
        """Serve the web dashboard"""
        template_path = Path(__file__).parent.parent / "templates" / "dashboard.html"
        
        if not template_path.exists():
            # Fallback to old location if templates folder doesn't exist yet
            fallback_path = Path(__file__).parent.parent / "dashboard.html"
            if fallback_path.exists():
                template_path = fallback_path
            else:
                return "<h1>Dashboard not found</h1><p>Please ensure dashboard.html is in the templates folder.</p>"
        
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    
    return app


# Create the application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print("=" * 60)
    print(f"API Server:       http://localhost:{settings.port}")
    print(f"API Docs:         http://localhost:{settings.port}/docs")
    print(f"Dashboard:        http://localhost:{settings.port}/dashboard")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )

