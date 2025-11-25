"""
Data Acquisition API Endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from app.models.schemas import (
    DAQReadResponse,
    DAQData
)
from app.services.acquisition_service import acquisition_service

router = APIRouter(prefix="/api", tags=["acquisition"])


@router.post("/start-read-adc", response_model=DAQReadResponse)
async def start_read_adc(
    samples: int = Query(default=500, ge=10, le=10000, description="Number of samples per channel"),
    sample_rate: int = Query(default=100, ge=1, le=10000, description="Sampling rate in Hz")
):
    """
    Start ADC measurement and read data from all 4 ADC channels
    
    This endpoint ONLY reads ADC data without any relay control.
    It does not charge capacitors or modify any relay states.
    
    Use this endpoint when:
    - Relays are already configured manually
    - You want direct ADC readings without circuit modifications
    - Testing ADC channels independently
    
    Args:
        samples: Number of samples per channel (default: 500, range: 10-10000)
        sample_rate: Sampling rate in Hz (default: 100, range: 1-10000)
        
    Returns:
        Acquired data from all 4 ADC channels
    """
    try:
        # Read ADC data only, no relay control
        adc1, adc2, adc3, adc4 = acquisition_service.start_read_adc(
            samples_per_channel=samples,
            sample_rate=sample_rate
        )
        
        return DAQReadResponse(
            status="success",
            samples=samples,
            sample_rate=sample_rate,
            channels=4,
            data=DAQData(
                adc1=adc1,
                adc2=adc2,
                adc3=adc3,
                adc4=adc4
            ),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading ADC data: {str(e)}"
        )

