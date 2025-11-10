"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


# ============== Device Models ==============

class DeviceInfo(BaseModel):
    """Information about a single DAQ device"""
    name: str
    product_category: str
    product_type: str


class DevicesResponse(BaseModel):
    """Response model for device query"""
    driver_version: str
    devices: List[DeviceInfo]


# ============== Relay Models ==============

class RelayControlResponse(BaseModel):
    """Response model for relay control"""
    relay: str
    state: bool
    message: str
    timestamp: str


class RelaysListResponse(BaseModel):
    """Response model for available relays"""
    relays: List[str]


# ============== Data Acquisition Models ==============

class DAQReadRequest(BaseModel):
    """Request model for DAQ data reading"""
    samples: int = Field(default=500, ge=10, le=10000, description="Number of samples per channel")
    sample_rate: int = Field(default=100, ge=1, le=10000, description="Sampling rate in Hz")


class DAQData(BaseModel):
    """DAQ channel data"""
    adc1: List[float]
    adc2: List[float]
    adc3: List[float]
    adc4: List[float]


class DAQReadResponse(BaseModel):
    """Response model for DAQ data reading"""
    status: str
    samples: int
    sample_rate: int
    channels: int
    data: DAQData
    timestamp: str


class CapacitorChargeResponse(BaseModel):
    """Response model for capacitor charging"""
    status: str
    message: str
    timestamp: str


# ============== WebSocket Models ==============

class WebSocketCommand(BaseModel):
    """WebSocket command from client"""
    action: str  # 'start' or 'stop'
    sample_rate: Optional[int] = 100
    interval: Optional[float] = 0.1


class WebSocketDataMessage(BaseModel):
    """WebSocket data message to client"""
    type: str = "data"
    timestamp: str
    data: DAQData


class WebSocketStatusMessage(BaseModel):
    """WebSocket status message"""
    type: str
    status: str
    message: str


class WebSocketErrorMessage(BaseModel):
    """WebSocket error message"""
    type: str = "error"
    message: str


# ============== General Response Models ==============

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str


class APIInfo(BaseModel):
    """API information response"""
    name: str
    version: str
    endpoints: Dict[str, str]

