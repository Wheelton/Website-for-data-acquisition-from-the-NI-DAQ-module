"""
FastAPI Web Service for NI DAQ Data Acquisition
Provides REST API and WebSocket endpoints for real-time data acquisition
"""
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from typing import Dict, List
from datetime import datetime
import nidaqmx as ni
from nidaqmx.constants import AcquisitionType
import time

# Import DAQ functions from test.py
import sys
import os
import importlib.util

# Load test.py as a module explicitly to avoid conflict with built-in test module
# Try to get the directory of the current file, fall back to current working directory
try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
except NameError:
    base_dir = os.getcwd()

test_path = os.path.join(base_dir, "test.py")
if not os.path.exists(test_path):
    # Try current working directory
    test_path = os.path.join(os.getcwd(), "test.py")

spec = importlib.util.spec_from_file_location("daq_test", test_path)
daq_test = importlib.util.module_from_spec(spec)
spec.loader.exec_module(daq_test)

# Import functions
zs1_1_call = daq_test.zs1_1_call
zs1_2_call = daq_test.zs1_2_call
zs2_1_call = daq_test.zs2_1_call
zs2_2_call = daq_test.zs2_2_call
zk1_5_call = daq_test.zk1_5_call
zk1_8_call = daq_test.zk1_8_call
zk2_1_call = daq_test.zk2_1_call
zk2_5_call = daq_test.zk2_5_call
laduj_Cs1 = daq_test.laduj_Cs1
query_devices = daq_test.query_devices
daq_base = daq_test.daq_base

app = FastAPI(
    title="NI DAQ Web Service",
    description="Web service for data acquisition from NI DAQ module",
    version="1.0.0"
)

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
active_connections: List[WebSocket] = []


# ============== Device Information Endpoints ==============

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "NI DAQ Web Service",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "devices": "/api/devices",
            "relays": "/api/relay/{relay_name}/{state}",
            "read_daq": "/api/read-daq",
            "charge_capacitor": "/api/charge-capacitor",
            "websocket": "/ws/daq"
        }
    }


@app.get("/api/devices")
async def get_devices():
    """Get information about connected DAQ devices"""
    try:
        local_system = ni.system.System.local()
        driver_version = local_system.driver_version
        
        devices = []
        for device in local_system.devices:
            devices.append({
                "name": device.name,
                "product_category": str(device.product_category),
                "product_type": device.product_type
            })
        
        return {
            "driver_version": f"{driver_version.major_version}.{driver_version.minor_version}.{driver_version.update_version}",
            "devices": devices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying devices: {str(e)}")


# ============== Relay Control Endpoints ==============

@app.post("/api/relay/{relay_name}/{state}")
async def control_relay(relay_name: str, state: bool):
    """
    Control a specific relay
    
    relay_name: zs1_1, zs1_2, zs2_1, zs2_2, zk1_5, zk1_8, zk2_1, zk2_5
    state: true (on) or false (off)
    """
    relay_functions = {
        "zs1_1": zs1_1_call,
        "zs1_2": zs1_2_call,
        "zs2_1": zs2_1_call,
        "zs2_2": zs2_2_call,
        "zk1_5": zk1_5_call,
        "zk1_8": zk1_8_call,
        "zk2_1": zk2_1_call,
        "zk2_5": zk2_5_call,
    }
    
    if relay_name not in relay_functions:
        raise HTTPException(status_code=400, detail=f"Unknown relay: {relay_name}")
    
    try:
        result = relay_functions[relay_name](state)
        return {
            "relay": relay_name,
            "state": state,
            "message": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error controlling relay: {str(e)}")


@app.get("/api/relays")
async def get_available_relays():
    """Get list of available relays"""
    return {
        "relays": [
            "zs1_1", "zs1_2", "zs2_1", "zs2_2",
            "zk1_5", "zk1_8", "zk2_1", "zk2_5"
        ]
    }


# ============== Data Acquisition Endpoints ==============

@app.post("/api/charge-capacitor")
async def charge_capacitor():
    """Execute the capacitor charging sequence"""
    try:
        laduj_Cs1()
        return {
            "status": "success",
            "message": "Capacitor charging sequence completed",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error charging capacitor: {str(e)}")


@app.post("/api/read-daq")
async def read_daq_data(samples: int = 500, sample_rate: int = 100):
    """
    Read data from all 4 ADC channels
    
    samples: Number of samples per channel (default: 500)
    sample_rate: Sampling rate in Hz (default: 100)
    """
    try:
        samplemode = ni.constants.AcquisitionType.FINITE
        
        with ni.Task() as task_ai:
            # Configure channels
            task_ai.ai_channels.add_ai_voltage_chan(daq_base + "Mod1/ai0:3")
            task_ai.timing.cfg_samp_clk_timing(rate=sample_rate, sample_mode=samplemode)
            
            # Charge capacitor and read data
            laduj_Cs1()
            data = task_ai.read(number_of_samples_per_channel=samples)
        
        # Turn off relays
        zk1_8_call(False)
        zs1_1_call(False)
        
        return {
            "status": "success",
            "samples": samples,
            "sample_rate": sample_rate,
            "channels": 4,
            "data": {
                "adc1": data[0],
                "adc2": data[1],
                "adc3": data[2],
                "adc4": data[3]
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        # Make sure to turn off relays even if error occurs
        try:
            zk1_8_call(False)
            zs1_1_call(False)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error reading DAQ data: {str(e)}")


# ============== WebSocket for Real-Time Streaming ==============

@app.websocket("/ws/daq")
async def websocket_daq(websocket: WebSocket):
    """
    WebSocket endpoint for real-time DAQ data streaming
    
    Send JSON commands:
    - {"action": "start", "sample_rate": 100, "interval": 0.1}
    - {"action": "stop"}
    """
    await websocket.accept()
    active_connections.append(websocket)
    
    streaming = False
    sample_rate = 100
    interval = 0.1  # seconds between readings
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "WebSocket connected. Send 'start' command to begin streaming."
        })
        
        while True:
            # Check for commands from client
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                command = json.loads(message)
                
                if command.get("action") == "start":
                    streaming = True
                    sample_rate = command.get("sample_rate", 100)
                    interval = command.get("interval", 0.1)
                    await websocket.send_json({
                        "type": "status",
                        "status": "streaming",
                        "message": f"Started streaming at {sample_rate} Hz"
                    })
                
                elif command.get("action") == "stop":
                    streaming = False
                    await websocket.send_json({
                        "type": "status",
                        "status": "stopped",
                        "message": "Stopped streaming"
                    })
                    
            except asyncio.TimeoutError:
                pass  # No message received, continue
            
            # Stream data if enabled
            if streaming:
                try:
                    samplemode = ni.constants.AcquisitionType.FINITE
                    
                    with ni.Task() as task_ai:
                        task_ai.ai_channels.add_ai_voltage_chan(daq_base + "Mod1/ai0:3")
                        task_ai.timing.cfg_samp_clk_timing(rate=sample_rate, sample_mode=samplemode)
                        
                        data = task_ai.read(number_of_samples_per_channel=10)
                    
                    # Send data to client
                    await websocket.send_json({
                        "type": "data",
                        "timestamp": datetime.now().isoformat(),
                        "data": {
                            "adc1": data[0],
                            "adc2": data[1],
                            "adc3": data[2],
                            "adc4": data[3]
                        }
                    })
                    
                    await asyncio.sleep(interval)
                    
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error reading data: {str(e)}"
                    })
                    streaming = False
            else:
                await asyncio.sleep(0.1)
                
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


# ============== Web Interface ==============

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    """Serve the web dashboard"""
    with open("dashboard.html", "r") as f:
        return f.read()


if __name__ == "__main__":
    import uvicorn
    print("Starting NI DAQ Web Service...")
    print("Access the API at: http://localhost:8000")
    print("API Documentation at: http://localhost:8000/docs")
    print("Dashboard at: http://localhost:8000/dashboard")
    uvicorn.run(app, host="0.0.0.0", port=8000)

