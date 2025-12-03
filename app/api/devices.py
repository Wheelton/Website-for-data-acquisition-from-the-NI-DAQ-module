"""
Device Information API Endpoints
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import DevicesResponse
from app.services.device_service import device_service

router = APIRouter(prefix="/api", tags=["devices"])


@router.get("/devices", response_model=DevicesResponse)
async def get_devices():
    """
    Get information about connected DAQ devices
    
    Returns:
        Device information including driver version and connected devices
    """
    try:
        return device_service.get_devices()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error querying devices: {str(e)}"
        )

