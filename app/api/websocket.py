"""
WebSocket API for Real-Time Data Streaming
"""
from fastapi import APIRouter, WebSocket
import asyncio
import json
from datetime import datetime
from typing import List
from app.services.acquisition_service import acquisition_service

router = APIRouter(tags=["websocket"])

# Store active WebSocket connections
active_connections: List[WebSocket] = []


@router.websocket("/ws/daq")
async def websocket_daq(websocket: WebSocket):
    """
    WebSocket endpoint for real-time DAQ data streaming
    
    Send JSON commands:
    - {"action": "start", "sample_rate": 100, "interval": 0.1}
    - {"action": "stop"}
    
    Receives:
    - Connection status messages
    - Real-time data from all 4 ADC channels
    - Error messages
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
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.01
                )
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
                    # Read a small sample for streaming
                    adc1, adc2, adc3, adc4 = acquisition_service.read_continuous_sample(
                        samples_per_channel=10,
                        sample_rate=sample_rate
                    )
                    
                    # Send data to client
                    await websocket.send_json({
                        "type": "data",
                        "timestamp": datetime.now().isoformat(),
                        "data": {
                            "adc1": adc1,
                            "adc2": adc2,
                            "adc3": adc3,
                            "adc4": adc4
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

