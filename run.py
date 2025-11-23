"""
Simple entry point to run the NI DAQ Web Service
Usage: python run.py
"""
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
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

