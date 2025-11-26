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


@router.post("/start-read-adc")
async def start_read_adc(
    samples: int = Query(default=500, ge=100, le=500000, description="Number of samples per channel (or buffer size)"),
    sample_rate: int = Query(default=100, ge=1, le=1000000, description="Sampling rate in Hz"),
    measurement_time: float = Query(default=0, ge=0, le=10, description="Expected measurement duration in seconds (optional)")
):
    """
    Start continuous ADC measurement from all 4 ADC channels
    
    This endpoint configures and starts ADC data acquisition in the background.
    No data is returned until stop-read-adc is called.
    
    This endpoint ONLY configures ADC - it does not control relays or charge capacitors.
    
    Workflow:
    1. Call this endpoint to start acquisition
    2. Wait for desired duration or perform other operations
    3. Call /stop-read-adc to get all collected data
    
    Args:
        samples: Number of samples per channel to acquire (default: 500, range: 100-500000)
        sample_rate: Sampling rate in Hz (default: 100, range: 1-1000000)
        measurement_time: Expected measurement duration in seconds (default: 0, range: 0-10)
        
    Returns:
        Status message confirming acquisition has started
    """
    try:
        # Calculate optimal buffer size based on measurement time if provided
        # Otherwise use the samples parameter
        if measurement_time > 0:
            # Buffer size = sample_rate * measurement_time * safety_margin
            calculated_buffer = int(sample_rate * measurement_time * 1.15)  # 15% safety margin
            buffer_size = max(calculated_buffer, samples)  # Use larger of calculated or provided
        else:
            buffer_size = samples
        
        result = acquisition_service.start_read_adc(
            samples_per_channel=buffer_size,
            sample_rate=sample_rate
        )
        
        return {
            "status": "started",
            "message": f"ADC acquisition started successfully with buffer size: {buffer_size}",
            "samples_per_channel": result['samples_per_channel'],
            "sample_rate": result['sample_rate'],
            "channels": result['channels'],
            "buffer_size": buffer_size,
            "timestamp": datetime.now().isoformat()
        }
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error starting ADC acquisition: {str(e)}"
        )


@router.post("/stop-read-adc", response_model=DAQReadResponse)
async def stop_read_adc():
    """
    Stop ADC acquisition and return all collected data
    
    This endpoint stops the running ADC acquisition and returns all data
    collected from the 4 ADC channels since start-read-adc was called.
    
    Returns:
        All acquired data from all 4 ADC channels
        
    Raises:
        409 Conflict: If no acquisition is currently running
    """
    try:
        # Get config before stopping (stop_read_adc clears it)
        config = acquisition_service._task_config.copy() if acquisition_service._task_config else {}
        
        # Stop and get data
        adc1, adc2, adc3, adc4 = acquisition_service.stop_read_adc()
        
        return DAQReadResponse(
            status="success",
            samples=len(adc1),
            sample_rate=config.get('sample_rate', 0),
            channels=4,
            data=DAQData(
                adc1=adc1,
                adc2=adc2,
                adc3=adc3,
                adc4=adc4
            ),
            timestamp=datetime.now().isoformat()
        )
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error stopping ADC acquisition: {str(e)}"
        )


@router.get("/adc-status")
async def get_adc_status():
    """
    Check if ADC acquisition is currently running
    
    Returns:
        Status information about the current ADC acquisition state
    """
    is_running = acquisition_service.is_acquisition_running()
    config = acquisition_service._task_config.copy() if acquisition_service._task_config else None
    
    return {
        "is_running": is_running,
        "configuration": config,
        "timestamp": datetime.now().isoformat()
    }

