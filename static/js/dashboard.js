/**
 * NI DAQ Control Dashboard JavaScript
 * Handles device management, relay control, data acquisition, and real-time streaming
 */

const API_BASE = window.location.origin;
let ws = null;
let relayStates = {};
let charts = {};

// ============== Chart Management ==============

/**
 * Initialize all Chart.js charts for ADC channels
 */
function initCharts() {
    for (let i = 1; i <= 4; i++) {
        const ctx = document.getElementById(`chart${i}`).getContext('2d');
        charts[`adc${i}`] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: `ADC ${i}`,
                    data: [],
                    borderColor: `hsl(${i * 90}, 70%, 50%)`,
                    backgroundColor: `hsla(${i * 90}, 70%, 50%, 0.1)`,
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

/**
 * Update a specific chart with new data
 * @param {string} channel - Channel name (e.g., 'adc1')
 * @param {Array<number>} data - Array of voltage values
 */
function updateChart(channel, data) {
    const chart = charts[channel];
    if (!chart) return;

    chart.data.labels = data.map((_, i) => i);
    chart.data.datasets[0].data = data;
    chart.update();
}

// ============== Device Management ==============

/**
 * Load and display connected DAQ device information
 */
async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE}/api/devices`);
        const data = await response.json();
        
        let html = `<div class="device-info">
            <strong>Driver Version:</strong> ${data.driver_version}<br>
            <strong>Devices:</strong><br>`;
        
        data.devices.forEach(device => {
            html += `• ${device.name} (${device.product_type})<br>`;
        });
        
        html += `</div>`;
        document.getElementById('deviceInfo').innerHTML = html;
    } catch (error) {
        showStatus('deviceInfo', `Error: ${error.message}`, 'error');
    }
}

// ============== Relay Control ==============

/**
 * Initialize relay control buttons
 */
async function loadRelays() {
    const relays = ['zs1_1', 'zs1_2', 'zs2_1', 'zs2_2', 'zk1_5', 'zk1_8', 'zk2_1', 'zk2_5'];
    const container = document.getElementById('relayControls');
    
    relays.forEach(relay => {
        relayStates[relay] = false;
        const btn = document.createElement('button');
        btn.className = 'relay-btn';
        btn.id = `relay-${relay}`;
        btn.textContent = relay.toUpperCase();
        btn.onclick = () => toggleRelay(relay);
        container.appendChild(btn);
    });
}

/**
 * Toggle relay state on/off
 * @param {string} relay - Relay name (e.g., 'zs1_1')
 */
async function toggleRelay(relay) {
    const newState = !relayStates[relay];
    try {
        const response = await fetch(`${API_BASE}/api/relay/${relay}/${newState}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        relayStates[relay] = newState;
        const btn = document.getElementById(`relay-${relay}`);
        if (newState) {
            btn.classList.add('on');
        } else {
            btn.classList.remove('on');
        }
    } catch (error) {
        alert(`Error controlling relay: ${error.message}`);
    }
}

// ============== Data Acquisition ==============

/**
 * Execute capacitor charging sequence
 */
async function chargeCapacitor() {
    showStatus('daqStatus', 'Charging capacitor...', 'info');
    try {
        const response = await fetch(`${API_BASE}/api/charge-capacitor`, {
            method: 'POST'
        });
        const data = await response.json();
        showStatus('daqStatus', data.message, 'success');
    } catch (error) {
        showStatus('daqStatus', `Error: ${error.message}`, 'error');
    }
}

/**
 * Read data from all ADC channels and update charts
 */
async function readDAQ() {
    const samples = document.getElementById('samples').value;
    const sampleRate = document.getElementById('sampleRate').value;
    
    showStatus('daqStatus', 'Reading DAQ data...', 'info');
    try {
        const response = await fetch(`${API_BASE}/api/read-daq?samples=${samples}&sample_rate=${sampleRate}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        // Update charts with new data
        updateChart('adc1', data.data.adc1);
        updateChart('adc2', data.data.adc2);
        updateChart('adc3', data.data.adc3);
        updateChart('adc4', data.data.adc4);
        
        showStatus('daqStatus', `Successfully read ${data.samples} samples at ${data.sample_rate} Hz`, 'success');
    } catch (error) {
        showStatus('daqStatus', `Error: ${error.message}`, 'error');
    }
}

// ============== WebSocket Real-Time Streaming ==============

/**
 * Connect to WebSocket for real-time data streaming
 */
function connectWebSocket() {
    const wsUrl = `ws://${window.location.host}/ws/daq`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        document.getElementById('wsStatus').textContent = 'Connected';
        document.getElementById('wsIndicator').className = 'ws-indicator connected';
        document.getElementById('wsConnectBtn').disabled = true;
        document.getElementById('wsStartBtn').disabled = false;
        document.getElementById('wsStopBtn').disabled = false;
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
            updateChart('adc1', message.data.adc1);
            updateChart('adc2', message.data.adc2);
            updateChart('adc3', message.data.adc3);
            updateChart('adc4', message.data.adc4);
        }
    };

    ws.onclose = () => {
        document.getElementById('wsStatus').textContent = 'Disconnected';
        document.getElementById('wsIndicator').className = 'ws-indicator disconnected';
        document.getElementById('wsConnectBtn').disabled = false;
        document.getElementById('wsStartBtn').disabled = true;
        document.getElementById('wsStopBtn').disabled = true;
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

/**
 * Start real-time data streaming
 */
function startStreaming() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'start',
            sample_rate: 100,
            interval: 0.1
        }));
    }
}

/**
 * Stop real-time data streaming
 */
function stopStreaming() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'stop'
        }));
    }
}

// ============== UI Helper Functions ==============

/**
 * Display status message in specified element
 * @param {string} elementId - ID of the element to update
 * @param {string} message - Message to display
 * @param {string} type - Message type ('info', 'success', 'error')
 */
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.className = `status ${type}`;
    element.textContent = message;
}

/**
 * Toggle schematic diagram visibility
 */
function toggleSchematic() {
    const container = document.getElementById('schematicContainer');
    const toggleText = document.getElementById('toggleText');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggleText.textContent = 'Hide Schema';
    } else {
        container.style.display = 'none';
        toggleText.textContent = 'Show Schema';
    }
}

// ============== Initialization ==============

/**
 * Initialize dashboard on page load
 */
window.onload = () => {
    initCharts();
    loadDevices();
    loadRelays();
};

