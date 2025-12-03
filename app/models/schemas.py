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


class RelaysByModuleResponse(BaseModel):
    """Response model for relays in a specific module"""
    module: str
    relays: List[str]


class MultipleRelayControlRequest(BaseModel):
    """Request model for controlling multiple relays"""
    relay_states: Dict[str, bool] = Field(
        description="Dictionary of relay names and their desired states",
        example={"zs1_1": True, "zk1_5": False, "zk2_1": True}
    )


class MultipleRelayControlResponse(BaseModel):
    """Response model for multiple relay control"""
    status: str
    message: str
    relays_controlled: int
    timestamp: str


class RelayState(BaseModel):
    """Single relay state information"""
    name: str
    channel: str
    state: bool
    module: str


class AllRelayStatesResponse(BaseModel):
    """Response model for all relay states"""
    total_relays: int
    enabled_count: int
    disabled_count: int
    relays: List[RelayState]
    timestamp: str


class DisableAllRelaysResponse(BaseModel):
    """Response model for disabling all relays"""
    status: str
    message: str
    relays_disabled: int
    timestamp: str


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


class CapacitorDischargeRequest(BaseModel):
    """Request model for capacitor discharging"""
    capacitor: str = Field(
        description="Capacitor to discharge: cs1 (48μF), cs2 (9.5μF), cs3 (1μF), or cs4 (222nF)",
        pattern="^(cs[1-4]|CS[1-4])$"
    )
    discharge_resistor: str = Field(
        default='rz2',
        description="Discharge resistor: rz1 (3Ω), rz2 (21.7Ω - default), rz3 (357Ω), or rz4 (2.18kΩ)",
        pattern="^(rz[1-4]|RZ[1-4])$"
    )
    duration: float = Field(
        default=0.5,
        ge=0.1,
        le=10.0,
        description="Discharge duration in seconds (default: 0.5, range: 0.1-10.0)"
    )


class CapacitorDischargeResponse(BaseModel):
    """Response model for capacitor discharging"""
    status: str
    capacitor: str
    discharge_resistor: str
    duration: float
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

