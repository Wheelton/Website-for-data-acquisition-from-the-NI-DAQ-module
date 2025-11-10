# NI DAQ Web Service

A FastAPI-based web service for data acquisition from National Instruments DAQ modules.

## Features

- **REST API** endpoints for device control and data acquisition
- **WebSocket** support for real-time data streaming
- **Interactive Dashboard** with live charts
- **Relay Controls** for all connected relays
- **Automatic API Documentation** at `/docs`

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Option 1: Using Python directly
```bash
python app.py
```

### Option 2: Using Uvicorn
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The service will start on `http://localhost:8000`

## Accessing the Service

- **Dashboard**: http://localhost:8000/dashboard
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## API Endpoints

### Device Information
- `GET /` - API information
- `GET /api/devices` - List connected DAQ devices

### Relay Control
- `POST /api/relay/{relay_name}/{state}` - Control a specific relay
- `GET /api/relays` - List available relays

### Data Acquisition
- `POST /api/charge-capacitor` - Execute capacitor charging sequence
- `POST /api/read-daq?samples=500&sample_rate=100` - Read data from ADC channels

### WebSocket Streaming
- `WS /ws/daq` - WebSocket endpoint for real-time data streaming

## WebSocket Commands

Connect to `ws://localhost:8000/ws/daq` and send:

Start streaming:
```json
{
    "action": "start",
    "sample_rate": 100,
    "interval": 0.1
}
```

Stop streaming:
```json
{
    "action": "stop"
}
```

## Dashboard Features

The web dashboard provides:
- Device information display
- Relay control buttons
- Data acquisition controls
- Real-time chart visualization
- WebSocket connection management

## Example Usage with cURL

### Get device information
```bash
curl http://localhost:8000/api/devices
```

### Control a relay
```bash
curl -X POST http://localhost:8000/api/relay/zs1_1/true
```

### Read DAQ data
```bash
curl -X POST "http://localhost:8000/api/read-daq?samples=500&sample_rate=100"
```

## Network Access

The service runs on `0.0.0.0:8000`, making it accessible from:
- **Local machine**: http://localhost:8000
- **Network**: http://YOUR_IP_ADDRESS:8000

To find your IP address:
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

## Development

Enable auto-reload for development:
```bash
uvicorn app:app --reload
```

## Requirements

- Python 3.7+
- NI-DAQmx driver installed
- FastAPI and dependencies (see requirements.txt)

## Troubleshooting

### Port already in use
If port 8000 is busy, specify a different port:
```bash
uvicorn app:app --port 8001
```

### DAQ device not found
Make sure:
1. NI-DAQmx driver is installed
2. DAQ device is connected
3. Device name in `test.py` matches your device

### Import errors
Install all dependencies:
```bash
pip install -r requirements.txt
```

