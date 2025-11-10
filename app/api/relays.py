"""
Relay Control API Endpoints
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.models.schemas import RelayControlResponse, RelaysListResponse
from app.services.relay_service import relay_service

router = APIRouter(prefix="/api", tags=["relays"])


@router.post("/relay/{relay_name}/{state}", response_model=RelayControlResponse)
async def control_relay(relay_name: str, state: bool):
    """
    Control a specific relay
    
    Args:
        relay_name: Name of the relay (zs1_1, zs1_2, zs2_1, zs2_2, zk1_5, zk1_8, zk2_1, zk2_5)
        state: true (on) or false (off)
        
    Returns:
        Relay control status and timestamp
    """
    try:
        result = relay_service.control_relay(relay_name, state)
        return RelayControlResponse(
            relay=relay_name,
            state=state,
            message=result,
            timestamp=datetime.now().isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error controlling relay: {str(e)}"
        )


@router.get("/relays", response_model=RelaysListResponse)
async def get_available_relays():
    """
    Get list of all available relays
    
    Returns:
        List of relay names that can be controlled
    """
    return RelaysListResponse(
        relays=relay_service.get_available_relays()
    )

