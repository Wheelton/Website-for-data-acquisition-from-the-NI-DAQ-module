"""
Main API Router
Aggregates all API routers
"""
from fastapi import APIRouter
from app.api import devices, relays, acquisition, websocket

# Create main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(devices.router)
api_router.include_router(relays.router)
api_router.include_router(acquisition.router)
api_router.include_router(websocket.router)

