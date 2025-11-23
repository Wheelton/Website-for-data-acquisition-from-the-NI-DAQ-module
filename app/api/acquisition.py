"""
Data Acquisition API Endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from app.models.schemas import (
    DAQReadResponse,
    DAQData,
    CapacitorChargeResponse
)
from app.services.acquisition_service import acquisition_service

router = APIRouter(prefix="/api", tags=["acquisition"])


@router.post("/charge-capacitor", response_model=CapacitorChargeResponse)
async def charge_capacitor():
    """
    Execute the capacitor charging sequence
    
    Returns:
        Status message confirming capacitor charging
    """
    try:
        acquisition_service.charge_capacitor_cs1()
        return CapacitorChargeResponse(
            status="success",
            message="Capacitor charging sequence completed",
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error charging capacitor: {str(e)}"
        )


@router.post("/read-daq", response_model=DAQReadResponse)
async def read_daq_data(
    samples: int = Query(default=500, ge=10, le=10000, description="Number of samples per channel"),
    sample_rate: int = Query(default=100, ge=1, le=10000, description="Sampling rate in Hz")
):
    """
    Read data from all 4 ADC channels
    
    This endpoint performs a complete acquisition cycle:
    1. Charges the capacitor
    2. Reads data from all channels
    3. Turns off relays
    
    Args:
        samples: Number of samples per channel (default: 500, range: 10-10000)
        sample_rate: Sampling rate in Hz (default: 100, range: 1-10000)
        
    Returns:
        Acquired data from all 4 ADC channels
    """
    try:
        # Read data with automatic charging and relay management
        adc1, adc2, adc3, adc4 = acquisition_service.read_with_charging(
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
            detail=f"Error reading DAQ data: {str(e)}"
        )

