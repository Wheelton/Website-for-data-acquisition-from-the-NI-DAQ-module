"""
Relay Control API Endpoints
"""
from fastapi import APIRouter, HTTPException, Path
from datetime import datetime
from app.models.schemas import (
    RelayControlResponse, 
    RelaysListResponse,
    RelaysByModuleResponse,
    MultipleRelayControlRequest,
    MultipleRelayControlResponse,
    AllRelayStatesResponse,
    RelayState,
    DisableAllRelaysResponse,
    CapacitorDischargeRequest,
    CapacitorDischargeResponse
)
from app.services.relay_service import relay_service
from app.services.acquisition_service import acquisition_service

router = APIRouter(prefix="/api", tags=["relays"])


@router.post("/relay/{relay_name}/{state}", response_model=RelayControlResponse)
async def control_relay(relay_name: str, state: bool):
    """
    Control a specific relay
    
    Args:
        relay_name: Name of the relay. Available relays:
            - ZS1 Module: zs1_1, zs1_2, zs1_3, zs1_4
            - ZS2 Module: zs2_1, zs2_2, zs2_3, zs2_4
            - ZK1 Module: zk1_1 through zk1_8
            - ZK2 Module: zk2_1 through zk2_8
            - ZK3 Module: zk3_1 through zk3_8
            - ZK4 Module: zk4_1 through zk4_8
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
        List of all 56 relay names that can be controlled across all modules
    """
    return RelaysListResponse(
        relays=relay_service.get_available_relays()
    )


@router.get("/relays/module/{module_name}", response_model=RelaysByModuleResponse)
async def get_relays_by_module(
    module_name: str = Path(
        ...,
        description="Module name (zs1, zs2, zk1, zk2, zk3, or zk4)"
    )
):
    """
    Get list of relays for a specific module
    
    Args:
        module_name: Module identifier (zs1, zs2, zk1, zk2, zk3, zk4)
        
    Returns:
        List of relay names for the specified module
    """
    try:
        module_lower = module_name.lower()
        valid_modules = ['zs1', 'zs2', 'zk1', 'zk2', 'zk3', 'zk4']
        
        if module_lower not in valid_modules:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid module name. Must be one of: {', '.join(valid_modules)}"
            )
        
        relays = relay_service.get_relays_by_module(module_lower)
        return RelaysByModuleResponse(
            module=module_name,
            relays=relays
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting relays for module: {str(e)}"
        )


@router.post("/relays/multiple", response_model=MultipleRelayControlResponse)
async def control_multiple_relays(request: MultipleRelayControlRequest):
    """
    Control multiple relays at once
    
    This endpoint allows you to set the state of multiple relays in a single request,
    which is more efficient than making individual calls.
    
    Args:
        request: Dictionary of relay names and their desired states
        
    Returns:
        Status message and count of relays controlled
        
    Example request body:
        {
            "relay_states": {
                "zs1_1": true,
                "zk1_5": false,
                "zk2_1": true,
                "zs2_2": false
            }
        }
    """
    try:
        result = relay_service.control_multiple_relays(request.relay_states)
        return MultipleRelayControlResponse(
            status="success",
            message=result,
            relays_controlled=len(request.relay_states),
            timestamp=datetime.now().isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error controlling multiple relays: {str(e)}"
        )


@router.get("/relays/states", response_model=AllRelayStatesResponse)
async def get_all_relay_states():
    """
    Get the current state of all relays
    
    This endpoint returns the state (ON/OFF) of all 56 relays across all modules.
    Useful for monitoring and debugging relay configurations.
    
    Returns:
        Current state of all relays with statistics
    """
    try:
        relay_states = relay_service.get_all_relay_states()
        
        # Build detailed relay state list
        relay_list = []
        for relay_name, state in relay_states.items():
            # Extract module name (e.g., 'zs1' from 'zs1_1')
            module = relay_name.split('_')[0].upper()
            channel = relay_service.relay_mapping.get_channel(relay_name)
            
            relay_list.append(RelayState(
                name=relay_name,
                channel=channel,
                state=state,
                module=module
            ))
        
        # Calculate statistics
        enabled_count = sum(1 for r in relay_list if r.state)
        disabled_count = len(relay_list) - enabled_count
        
        return AllRelayStatesResponse(
            total_relays=len(relay_list),
            enabled_count=enabled_count,
            disabled_count=disabled_count,
            relays=relay_list,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting relay states: {str(e)}"
        )


@router.post("/relays/disable-all", response_model=DisableAllRelaysResponse)
async def disable_all_relays():
    """
    Disable all relays (turn OFF all relays)
    
    This endpoint turns off all 56 relays, regardless of their current state.
    Use this for emergency shutdown or system reset.
    
    Returns:
        Status message and count of relays that were disabled
    """
    try:
        message = relay_service.disable_all_relays()
        enabled_relays = relay_service.get_enabled_relays()
        
        return DisableAllRelaysResponse(
            status="success",
            message=message,
            relays_disabled=0,  # All should be off now
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error disabling relays: {str(e)}"
        )


@router.post("/relays/disable-enabled", response_model=DisableAllRelaysResponse)
async def disable_enabled_relays():
    """
    Disable only the relays that are currently enabled
    
    This endpoint is more efficient than disable-all as it only affects
    relays that are currently ON. Returns the list of relays that were disabled.
    
    Returns:
        Status message and list of disabled relay names
    """
    try:
        disabled_relays, count = relay_service.disable_enabled_relays()
        
        message = f"Disabled {count} relay(s): {', '.join(disabled_relays)}" if count > 0 else "No relays were enabled"
        
        return DisableAllRelaysResponse(
            status="success",
            message=message,
            relays_disabled=count,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error disabling enabled relays: {str(e)}"
        )


@router.post("/relays/sync-with-hardware", response_model=AllRelayStatesResponse)
async def sync_relays_with_hardware():
    """
    Synchronize internal relay states with actual hardware states
    
    This endpoint reads the actual state of all 56 relays from the hardware
    and updates the internal state tracking. Useful for:
    - Application startup to detect relays left ON
    - After external hardware changes
    - Verifying state consistency
    
    Returns:
        Current state of all relays read directly from hardware
    """
    try:
        hardware_states = relay_service.sync_with_hardware()
        
        # Build detailed relay state list
        relay_list = []
        for relay_name, state in hardware_states.items():
            # Extract module name (e.g., 'zs1' from 'zs1_1')
            module = relay_name.split('_')[0].upper()
            channel = relay_service.relay_mapping.get_channel(relay_name)
            
            relay_list.append(
                RelayState(
                    name=relay_name,
                    channel=channel,
                    state=state,
                    module=module
                )
            )
        
        # Count enabled and disabled relays
        enabled_count = sum(1 for state in hardware_states.values() if state)
        disabled_count = len(hardware_states) - enabled_count
        
        return AllRelayStatesResponse(
            total_relays=len(hardware_states),
            enabled_count=enabled_count,
            disabled_count=disabled_count,
            relays=relay_list,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error syncing relay states with hardware: {str(e)}"
        )


@router.post("/discharge-capacitor", response_model=CapacitorDischargeResponse)
async def discharge_capacitor(request: CapacitorDischargeRequest):
    """
    Discharge a capacitor through a specified discharge resistor
    
    This endpoint controls relays to safely discharge a capacitor through
    a selected resistor, then turns off all relays.
    
    Args:
        request: Request body with capacitor, discharge resistor, and duration
    
    Available capacitors:
        - cs1: 48 μF (relay zk2_1)
        - cs2: 9.5 μF (relay zk2_2)
        - cs3: 1 μF (relay zk2_3)
        - cs4: 222 nF (relay zk2_4)
    
    Available discharge resistors:
        - rz1: 3 Ω (relay zk2_5 - R2s1)
        - rz2: 21.7 Ω (relay zk2_6 - R2s2) - default
        - rz3: 357 Ω (relay zk2_7 - R2s3)
        - rz4: 2.18 kΩ (relay zk2_8 - R2s4)
    
    Returns:
        Status message confirming capacitor discharge
        
    Example request body:
        {
            "capacitor": "cs1",
            "discharge_resistor": "rz2",
            "duration": 0.5
        }
    """
    try:
        acquisition_service.discharge_capacitor(
            capacitor=request.capacitor.lower(),
            discharge_resistor=request.discharge_resistor.lower(),
            duration=request.duration
        )
        
        # Component names for display
        capacitor_names = {
            'cs1': '48 μF',
            'cs2': '9.5 μF',
            'cs3': '1 μF',
            'cs4': '222 nF'
        }
        
        discharge_resistor_names = {
            'rz1': '3 Ω',
            'rz2': '21.7 Ω',
            'rz3': '357 Ω',
            'rz4': '2.18 kΩ'
        }
        
        return CapacitorDischargeResponse(
            status="success",
            capacitor=request.capacitor.lower(),
            discharge_resistor=request.discharge_resistor.lower(),
            duration=request.duration,
            message=f"Capacitor {request.capacitor.upper()} ({capacitor_names.get(request.capacitor.lower(), 'unknown')}) "
                    f"discharged through {request.discharge_resistor.upper()} ({discharge_resistor_names.get(request.discharge_resistor.lower(), 'unknown')}) "
                    f"for {request.duration}s",
            timestamp=datetime.now().isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error discharging capacitor: {str(e)}"
        )

