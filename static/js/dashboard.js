/**
 * NI DAQ Control Dashboard JavaScript
 * Handles circuit selection and schematic toggle
 */

let selectedCircuit = null;
let isExtendedView = false;
let isMeasuring = false;
let measurementTimer = null;
let charts = {};
let measurementData = {};

// Persistent measurement values (remember across circuit switches)
let measurementValues = {
    samples: 500,
    sampleRate: 100,
    measurementTime: 5
};

// Channel mappings for each circuit type
const channelMappings = {
    'rl': [
        { id: 'ch1', name: 'CH1 - Voltage across Inductor (Ls)', color: '#3b82f6' },
        { id: 'ch2', name: 'CH2 - Voltage across Resistor (R)', color: '#ef4444' },
        { id: 'ch4', name: 'CH4 - Current Measurement', color: '#10b981' }
    ],
    'rc': [
        { id: 'ch3', name: 'CH3 - Voltage across Capacitor (Cs)', color: '#f59e0b' },
        { id: 'ch2', name: 'CH2 - Voltage across Resistor (R)', color: '#ef4444' },
        { id: 'ch4', name: 'CH4 - Current Measurement', color: '#10b981' }
    ],
    'rlc': [
        { id: 'ch1', name: 'CH1 - Voltage across Inductor (Ls)', color: '#3b82f6' },
        { id: 'ch3', name: 'CH3 - Voltage across Capacitor (Cs)', color: '#f59e0b' },
        { id: 'ch2', name: 'CH2 - Voltage across Resistor (R)', color: '#ef4444' },
        { id: 'ch4', name: 'CH4 - Current Measurement', color: '#10b981' }
    ]
};

// ============== Circuit Selection ==============

/**
 * Handle circuit card selection
 * @param {string} circuitType - Circuit type ('rl', 'rc', 'rlc')
 */
function selectCircuit(circuitType) {
    const circuitCard = document.getElementById(`circuit-${circuitType}`);
    const allCards = document.querySelectorAll('.circuit-card');
    const section = document.querySelector('.circuit-selection-section');
    
    // If clicking the currently selected circuit, deselect it
    if (selectedCircuit === circuitType) {
        selectedCircuit = null;
        
        // Remove section optimization
        section.classList.remove('has-selection');
        
        // Hide parameter section
        hideParameterSection();
        
        // Hide results section
        hideResultsSection();
        
        // Show all cards and remove selected state
        allCards.forEach(card => {
            card.classList.remove('selected', 'hidden');
        });
    } else {
        // Select the clicked circuit
        selectedCircuit = circuitType;
        
        // Add section optimization
        section.classList.add('has-selection');
        
        // Update all cards
        allCards.forEach(card => {
            const cardType = card.id.replace('circuit-', '');
            
            if (cardType === circuitType) {
                // This is the selected card
                card.classList.add('selected');
                card.classList.remove('hidden');
            } else {
                // These are the other cards - hide them
                card.classList.remove('selected');
                card.classList.add('hidden');
            }
        });
        
        // Show parameter section for selected circuit
        showParameterSection(circuitType);
    }
}

/**
 * Show parameter selection based on circuit type
 * @param {string} circuitType - Circuit type ('rl', 'rc', 'rlc')
 */
function showParameterSection(circuitType) {
    const paramSection = document.getElementById('parameterSection');
    const paramGrid = document.getElementById('parameterGrid');
    const paramLs = document.getElementById('param-ls');
    const paramCs = document.getElementById('param-cs');
    const paramResistance = document.getElementById('param-resistance');
    const paramDischarge = document.getElementById('param-discharge');
    
    // Hide all parameters first
    paramLs.style.display = 'none';
    paramCs.style.display = 'none';
    paramResistance.style.display = 'none';
    paramDischarge.style.display = 'none';
    
    // Show parameters based on circuit type
    if (circuitType === 'rl') {
        // RL Circuit: Inductor + Resistor + Discharge Resistor
        paramLs.style.display = 'block';
        paramResistance.style.display = 'block';
        paramDischarge.style.display = 'block';
        paramGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else if (circuitType === 'rc') {
        // RC Circuit: Capacitor + Resistor + Discharge Resistor
        paramCs.style.display = 'block';
        paramResistance.style.display = 'block';
        paramDischarge.style.display = 'block';
        paramGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else if (circuitType === 'rlc') {
        // RLC Circuit: Inductor + Capacitor + Resistor + Discharge Resistor
        paramLs.style.display = 'block';
        paramCs.style.display = 'block';
        paramResistance.style.display = 'block';
        paramDischarge.style.display = 'block';
        paramGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
    
    // Show the parameter section
    paramSection.style.display = 'block';
    
    // Add event listeners to parameter selects for validation
    setupParameterValidation();
    
    // Show measurement section and restore values
    showMeasurementSection();
    
    // Scroll to parameter section after a brief delay to allow animations
    setTimeout(() => {
        scrollToParameterSection();
    }, 150);
}

/**
 * Scroll to Component Parameters section smoothly
 */
function scrollToParameterSection() {
    const paramSection = document.getElementById('parameterSection');
    if (paramSection) {
        // Calculate the position to center the parameter section
        const elementRect = paramSection.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
        
        // Smooth scroll to the calculated position
        window.scrollTo({
            top: middle,
            behavior: 'smooth'
        });
    }
}

/**
 * Hide parameter selection section
 */
function hideParameterSection() {
    const paramSection = document.getElementById('parameterSection');
    paramSection.style.display = 'none';
    
    // Reset all select values and clear errors
    const selectLs = document.getElementById('select-ls');
    const selectCs = document.getElementById('select-cs');
    const selectResistance = document.getElementById('select-resistance');
    const selectDischarge = document.getElementById('select-discharge');
    
    selectLs.value = '';
    selectCs.value = '';
    selectResistance.value = '';
    selectDischarge.value = '';
    
    hideError(selectLs, 'error-ls');
    hideError(selectCs, 'error-cs');
    hideError(selectResistance, 'error-resistance');
    
    // Hide measurement section
    hideMeasurementSection();
}

/**
 * Setup parameter validation event listeners
 */
function setupParameterValidation() {
    const selectLs = document.getElementById('select-ls');
    const selectCs = document.getElementById('select-cs');
    const selectResistance = document.getElementById('select-resistance');
    
    // Remove existing listeners (to prevent duplicates)
    selectLs.removeEventListener('change', validateParameters);
    selectCs.removeEventListener('change', validateParameters);
    selectResistance.removeEventListener('change', validateParameters);
    
    // Add new listeners
    selectLs.addEventListener('change', validateParameters);
    selectCs.addEventListener('change', validateParameters);
    selectResistance.addEventListener('change', validateParameters);
    
    // Initial validation
    validateParameters();
}

/**
 * Validate that all required parameters are selected
 */
function validateParameters() {
    const startBtn = document.getElementById('btnStartMeasurement');
    if (!startBtn || !selectedCircuit) {
        return;
    }
    
    const selectLs = document.getElementById('select-ls');
    const selectCs = document.getElementById('select-cs');
    const selectResistance = document.getElementById('select-resistance');
    const inputSamples = document.getElementById('input-samples');
    const inputSampleRate = document.getElementById('input-sample-rate');
    const inputMeasurementTime = document.getElementById('input-measurement-time');
    
    let allValid = true;
    let missingParams = [];
    
    // Validate circuit parameters
    if (selectedCircuit === 'rl') {
        // RL Circuit: needs Ls and Resistance
        if (!selectLs.value) {
            missingParams.push('Inductance (Ls)');
            showError(selectLs, 'error-ls');
            allValid = false;
        } else {
            hideError(selectLs, 'error-ls');
        }
        
        if (!selectResistance.value) {
            missingParams.push('Resistance');
            showError(selectResistance, 'error-resistance');
            allValid = false;
        } else {
            hideError(selectResistance, 'error-resistance');
        }
    } else if (selectedCircuit === 'rc') {
        // RC Circuit: needs Cs and Resistance
        if (!selectCs.value) {
            missingParams.push('Capacitance (Cs)');
            showError(selectCs, 'error-cs');
            allValid = false;
        } else {
            hideError(selectCs, 'error-cs');
        }
        
        if (!selectResistance.value) {
            missingParams.push('Resistance');
            showError(selectResistance, 'error-resistance');
            allValid = false;
        } else {
            hideError(selectResistance, 'error-resistance');
        }
    } else if (selectedCircuit === 'rlc') {
        // RLC Circuit: needs Ls, Cs, and Resistance
        if (!selectLs.value) {
            missingParams.push('Inductance (Ls)');
            showError(selectLs, 'error-ls');
            allValid = false;
        } else {
            hideError(selectLs, 'error-ls');
        }
        
        if (!selectCs.value) {
            missingParams.push('Capacitance (Cs)');
            showError(selectCs, 'error-cs');
            allValid = false;
        } else {
            hideError(selectCs, 'error-cs');
        }
        
        if (!selectResistance.value) {
            missingParams.push('Resistance');
            showError(selectResistance, 'error-resistance');
            allValid = false;
        } else {
            hideError(selectResistance, 'error-resistance');
        }
    }
    
    // Validate measurement inputs
    const samplesValue = parseFloat(inputSamples.value);
    if (!samplesValue || samplesValue < 10 || samplesValue > 10000) {
        missingParams.push('Samples');
        showError(inputSamples, 'error-samples');
        allValid = false;
    } else {
        hideError(inputSamples, 'error-samples');
    }
    
    const sampleRateValue = parseFloat(inputSampleRate.value);
    if (!sampleRateValue || sampleRateValue < 1 || sampleRateValue > 10000) {
        missingParams.push('Sample Rate');
        showError(inputSampleRate, 'error-sample-rate');
        allValid = false;
    } else {
        hideError(inputSampleRate, 'error-sample-rate');
    }
    
    const measurementTimeValue = parseFloat(inputMeasurementTime.value);
    if (!measurementTimeValue || measurementTimeValue < 0.1 || measurementTimeValue > 3600) {
        missingParams.push('Measurement Time');
        showError(inputMeasurementTime, 'error-measurement-time');
        allValid = false;
    } else {
        hideError(inputMeasurementTime, 'error-measurement-time');
    }
    
    // Update button tooltip message
    if (missingParams.length > 0) {
        startBtn.setAttribute('data-tooltip', 'Missing or invalid: ' + missingParams.join(', '));
    } else {
        startBtn.setAttribute('data-tooltip', 'Ready to start measurement');
    }
    
    // Enable/disable start button based on validation
    // Also check if not currently measuring
    startBtn.disabled = !allValid || isMeasuring;
}

/**
 * Show error state on input/select
 * @param {HTMLElement} element - The input or select element
 * @param {string} tooltipId - The ID of the error tooltip (unused now, kept for compatibility)
 */
function showError(element, tooltipId) {
    element.classList.add('error');
    // Tooltip now shows on hover/focus via CSS
}

/**
 * Hide error state on input/select
 * @param {HTMLElement} element - The input or select element
 * @param {string} tooltipId - The ID of the error tooltip (unused now, kept for compatibility)
 */
function hideError(element, tooltipId) {
    element.classList.remove('error');
    // Tooltip automatically hidden when error class is removed
}

// ============== UI Helper Functions ==============

/**
 * Toggle schematic diagram visibility
 */
function toggleSchematic() {
    const section = document.getElementById('schematicSection');
    const toggleText = document.getElementById('toggleText');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        toggleText.textContent = '📐 Hide Schematic';
    } else {
        section.style.display = 'none';
        toggleText.textContent = '📐 Show Schematic';
    }
}

/**
 * Toggle between standard and extended schematic view with animation
 */
function toggleSchematicView() {
    const img = document.getElementById('schematicImage');
    const toggleViewText = document.getElementById('toggleViewText');
    
    // Add fade-out effect
    img.classList.add('fade-out');
    
    // Wait for fade-out animation to complete, then switch image
    setTimeout(() => {
        if (isExtendedView) {
            // Switch back to standard view
            img.src = '/static/schematic.png';
            img.onerror = function() {
                this.onerror = null;
                this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='800' height='400' fill='%23f0f0f0'/%3E%3Ctext x='400' y='200' text-anchor='middle' font-family='Arial' font-size='20' fill='%23666'%3ESchematic image not found%3C/text%3E%3Ctext x='400' y='230' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EPlease save your schematic as static/schematic.png%3C/text%3E%3C/svg%3E";
            };
            toggleViewText.textContent = '📋 Extended View';
            isExtendedView = false;
        } else {
            // Switch to extended view
            img.src = '/static/schematicExtended.png';
            img.onerror = function() {
                this.onerror = null;
                this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='800' height='400' fill='%23f0f0f0'/%3E%3Ctext x='400' y='200' text-anchor='middle' font-family='Arial' font-size='20' fill='%23666'%3EExtended schematic not found%3C/text%3E%3Ctext x='400' y='230' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EPlease save your extended schematic as static/schematicExtended.png%3C/text%3E%3C/svg%3E";
            };
            toggleViewText.textContent = '📄 Standard View';
            isExtendedView = true;
        }
        
        // Remove fade-out and trigger fade-in
        img.classList.remove('fade-out');
        img.classList.add('fade-in');
        
        // Clean up fade-in class after animation
        setTimeout(() => {
            img.classList.remove('fade-in');
        }, 300);
    }, 300);
}

// ============== Measurement Control ==============

/**
 * Show measurement section and restore saved values
 */
function showMeasurementSection() {
    const measurementSection = document.getElementById('measurementSection');
    
    // Restore saved values
    document.getElementById('input-samples').value = measurementValues.samples;
    document.getElementById('input-sample-rate').value = measurementValues.sampleRate;
    document.getElementById('input-measurement-time').value = measurementValues.measurementTime;
    
    // Initially disable start button until parameters are filled
    const startBtn = document.getElementById('btnStartMeasurement');
    if (startBtn) {
        startBtn.disabled = true;
    }
    
    // Show the section
    measurementSection.style.display = 'block';
    
    // Add event listeners to save values and validate on change
    const inputSamples = document.getElementById('input-samples');
    const inputSampleRate = document.getElementById('input-sample-rate');
    const inputMeasurementTime = document.getElementById('input-measurement-time');
    
    inputSamples.removeEventListener('input', handleMeasurementInput);
    inputSampleRate.removeEventListener('input', handleMeasurementInput);
    inputMeasurementTime.removeEventListener('input', handleMeasurementInput);
    
    inputSamples.addEventListener('input', handleMeasurementInput);
    inputSampleRate.addEventListener('input', handleMeasurementInput);
    inputMeasurementTime.addEventListener('input', handleMeasurementInput);
}

/**
 * Handle measurement input changes
 */
function handleMeasurementInput() {
    saveMeasurementValues();
    validateParameters();
}

/**
 * Hide measurement section
 */
function hideMeasurementSection() {
    const measurementSection = document.getElementById('measurementSection');
    measurementSection.style.display = 'none';
    
    // Clear all measurement input errors
    const inputSamples = document.getElementById('input-samples');
    const inputSampleRate = document.getElementById('input-sample-rate');
    const inputMeasurementTime = document.getElementById('input-measurement-time');
    
    hideError(inputSamples, 'error-samples');
    hideError(inputSampleRate, 'error-sample-rate');
    hideError(inputMeasurementTime, 'error-measurement-time');
    
    // Stop any running measurement
    if (isMeasuring) {
        stopMeasurement();
    }
    
    // Hide results section
    hideResultsSection();
}

/**
 * Save measurement input values for persistence
 */
function saveMeasurementValues() {
    measurementValues.samples = parseFloat(document.getElementById('input-samples').value) || 500;
    measurementValues.sampleRate = parseFloat(document.getElementById('input-sample-rate').value) || 100;
    measurementValues.measurementTime = parseFloat(document.getElementById('input-measurement-time').value) || 5;
}

/**
 * Start measurement
 */
function startMeasurement() {
    if (!selectedCircuit) {
        alert('Please select a circuit first');
        return;
    }
    
    // Get selected parameter values
    const selectLs = document.getElementById('select-ls');
    const selectCs = document.getElementById('select-cs');
    const selectResistance = document.getElementById('select-resistance');
    const selectDischarge = document.getElementById('select-discharge');
    
    const selectedParams = {
        circuit: selectedCircuit,
        ls: selectLs.value || null,
        cs: selectCs.value || null,
        resistance: selectResistance.value || null,
        dischargeResistor: selectDischarge.value || null
    };
    
    // Save current values
    saveMeasurementValues();
    
    // Update button states
    isMeasuring = true;
    const startBtn = document.getElementById('btnStartMeasurement');
    const stopBtn = document.getElementById('btnStopMeasurement');
    
    startBtn.disabled = true;
    startBtn.setAttribute('data-tooltip', 'Measurement in progress...');
    
    stopBtn.disabled = false;
    stopBtn.setAttribute('data-tooltip', 'Click to stop the ongoing measurement');
    
    // Show results section and initialize charts
    showResultsSection();
    initializeCharts();
    
    console.log('Starting measurement...', {
        ...selectedParams,
        samples: measurementValues.samples,
        sampleRate: measurementValues.sampleRate,
        measurementTime: measurementValues.measurementTime
    });
    
    // Scroll to results section
    setTimeout(() => {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 200);
    
    // Set automatic stop timer if measurement time is specified
    if (measurementValues.measurementTime > 0) {
        measurementTimer = setTimeout(() => {
            stopMeasurement();
            console.log('Measurement stopped automatically after ' + measurementValues.measurementTime + ' seconds');
        }, measurementValues.measurementTime * 1000);
    }
    
    // TODO: Implement actual data acquisition logic here
    // This will be connected to your backend API endpoints
    // For now, simulate some data
    simulateMeasurementData();
}

/**
 * Stop measurement
 */
function stopMeasurement() {
    // Clear automatic stop timer
    if (measurementTimer) {
        clearTimeout(measurementTimer);
        measurementTimer = null;
    }
    
    // Update button states
    isMeasuring = false;
    const stopBtn = document.getElementById('btnStopMeasurement');
    
    stopBtn.disabled = true;
    stopBtn.setAttribute('data-tooltip', 'No active measurement to stop');
    
    console.log('Measurement stopped');
    
    // Revalidate parameters to update start button state
    validateParameters();
    
    // TODO: Implement actual measurement stop logic here
}

// ============== Results Section ==============

/**
 * Show results section
 */
function showResultsSection() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
}

/**
 * Hide results section
 */
function hideResultsSection() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'none';
}

/**
 * Initialize charts based on selected circuit type
 */
function initializeCharts() {
    const chartsGrid = document.getElementById('chartsGrid');
    chartsGrid.innerHTML = ''; // Clear existing charts
    charts = {}; // Reset charts object
    measurementData = {}; // Reset measurement data
    
    if (!selectedCircuit || !channelMappings[selectedCircuit]) {
        return;
    }
    
    const channels = channelMappings[selectedCircuit];
    
    channels.forEach(channel => {
        // Create chart card
        const chartCard = document.createElement('div');
        chartCard.className = 'chart-card';
        chartCard.id = `card-${channel.id}`;
        
        // Create chart title
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = channel.name;
        
        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${channel.id}`;
        
        // Assemble elements
        chartContainer.appendChild(canvas);
        chartCard.appendChild(chartTitle);
        chartCard.appendChild(chartContainer);
        chartsGrid.appendChild(chartCard);
        
        // Initialize Chart.js chart
        const ctx = canvas.getContext('2d');
        charts[channel.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: channel.name,
                    data: [],
                    borderColor: channel.color,
                    backgroundColor: channel.color + '20',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (samples)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Voltage (V)'
                        },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
        
        // Initialize empty data array
        measurementData[channel.id] = [];
    });
}

/**
 * Update chart with new data
 * @param {string} channelId - Channel ID (e.g., 'ch1')
 * @param {Array<number>} data - Array of voltage values
 */
function updateChart(channelId, data) {
    const chart = charts[channelId];
    if (!chart) return;
    
    chart.data.labels = data.map((_, i) => i);
    chart.data.datasets[0].data = data;
    chart.update();
    
    // Store data
    measurementData[channelId] = data;
}

/**
 * Simulate measurement data for testing
 * TODO: Replace with actual data acquisition from backend
 */
function simulateMeasurementData() {
    const samples = measurementValues.samples;
    
    // Generate simulated data for each active channel
    Object.keys(charts).forEach(channelId => {
        const data = [];
        for (let i = 0; i < samples; i++) {
            // Generate sinusoidal wave with some noise
            const value = Math.sin(i * 0.1) * 2 + Math.random() * 0.5;
            data.push(value);
        }
        updateChart(channelId, data);
    });
}

/**
 * Save results to JSON file
 */
function saveResultsJSON() {
    if (Object.keys(measurementData).length === 0) {
        alert('No measurement data to save');
        return;
    }
    
    const exportData = prepareExportData();
    
    // Convert to JSON with formatting
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `measurement_${selectedCircuit}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Results saved to JSON file');
}

/**
 * Save results to CSV file
 */
function saveResultsCSV() {
    if (Object.keys(measurementData).length === 0) {
        alert('No measurement data to save');
        return;
    }
    
    const exportData = prepareExportData();
    
    // Build CSV content
    let csvContent = '';
    
    // Metadata section
    csvContent += '=== METADATA ===\n';
    csvContent += `Circuit,${exportData.metadata.circuit}\n`;
    csvContent += `Circuit Description,${exportData.metadata.circuitDescription}\n`;
    csvContent += `Timestamp,${exportData.metadata.timestamp}\n`;
    csvContent += `Date,${exportData.metadata.dateFormatted}\n`;
    csvContent += `Samples per Channel,${exportData.metadata.samplesPerChannel}\n`;
    csvContent += `Sample Rate,${exportData.metadata.sampleRate} ${exportData.metadata.sampleRateUnit}\n`;
    csvContent += `Measurement Time,${exportData.metadata.measurementTime} ${exportData.metadata.measurementTimeUnit}\n`;
    csvContent += '\n';
    
    // Parameters section
    csvContent += '=== PARAMETERS ===\n';
    if (exportData.parameters.inductance) {
        csvContent += `Inductance (Ls),${exportData.parameters.inductance.replace('Ω', 'ohm')}\n`;
    }
    if (exportData.parameters.capacitance) {
        csvContent += `Capacitance (Cs),${exportData.parameters.capacitance.replace('μF', 'nF')}\n`;
    }
    if (exportData.parameters.resistance) {
        csvContent += `Resistance,${exportData.parameters.resistance.replace('Ω', 'ohm')}\n`;
    }
    if (exportData.parameters.dischargeResistor) {
        csvContent += `Discharge Resistor (Rz),${exportData.parameters.dischargeResistor.replace('Ω', 'ohm')}\n`;
    }
    csvContent += '\n';
    
    // Channels data section
    csvContent += '=== MEASUREMENT DATA ===\n';
    
    // Get all channel IDs
    const channelIds = Object.keys(exportData.channels);
    
    // Create header row with channel information
    const headerRow1 = ['Sample'];
    const headerRow2 = ['Index'];
    
    channelIds.forEach(channelId => {
        const channel = exportData.channels[channelId];
        headerRow1.push(`${channel.channelName} - ${channel.description}`);
        headerRow2.push(`${channel.unit}`);
    });
    
    csvContent += headerRow1.join(',') + '\n';
    csvContent += headerRow2.join(',') + '\n';
    
    // Data rows
    const maxLength = Math.max(...channelIds.map(id => exportData.channels[id].data.length));
    
    for (let i = 0; i < maxLength; i++) {
        const row = [i];
        channelIds.forEach(channelId => {
            const value = exportData.channels[channelId].data[i];
            row.push(value !== undefined ? value : '');
        });
        csvContent += row.join(',') + '\n';
    }
    
    // Create blob and download
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `measurement_${selectedCircuit}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Results saved to CSV file');
}

/**
 * Prepare export data structure (common for JSON and CSV)
 * @returns {Object} Export data with metadata, parameters, and channels
 */
function prepareExportData() {
    // Get selected parameters for metadata
    const selectLs = document.getElementById('select-ls');
    const selectCs = document.getElementById('select-cs');
    const selectResistance = document.getElementById('select-resistance');
    const selectDischarge = document.getElementById('select-discharge');
    
    // Get parameter text (user-friendly display)
    const getParameterText = (selectElement) => {
        if (!selectElement.value) return null;
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        return selectedOption ? selectedOption.text : null;
    };
    
    // Build channels data with metadata
    const channelsExport = {};
    const activeChannels = channelMappings[selectedCircuit];
    
    activeChannels.forEach(channel => {
        if (measurementData[channel.id]) {
            channelsExport[channel.id] = {
                channelName: channel.id.toUpperCase(),
                description: channel.name,
                unit: 'V', // Voltage for all channels
                dataPoints: measurementData[channel.id].length,
                data: measurementData[channel.id]
            };
        }
    });
    
    // Prepare complete export data
    return {
        metadata: {
            circuit: selectedCircuit.toUpperCase(),
            circuitDescription: getCircuitDescription(selectedCircuit),
            timestamp: new Date().toISOString(),
            dateFormatted: new Date().toLocaleString(),
            samplesPerChannel: measurementValues.samples,
            sampleRate: measurementValues.sampleRate,
            sampleRateUnit: 'Hz',
            measurementTime: measurementValues.measurementTime,
            measurementTimeUnit: 's'
        },
        parameters: {
            inductance: getParameterText(selectLs),
            capacitance: getParameterText(selectCs),
            resistance: getParameterText(selectResistance),
            dischargeResistor: getParameterText(selectDischarge) || 'Not used'
        },
        channels: channelsExport
    };
}

/**
 * Get circuit description
 * @param {string} circuit - Circuit type
 * @returns {string} Circuit description
 */
function getCircuitDescription(circuit) {
    const descriptions = {
        'rl': 'Series RL Circuit (Inductor + Resistor)',
        'rc': 'Series RC Circuit (Capacitor + Resistor)',
        'rlc': 'Series RLC Circuit (Inductor + Capacitor + Resistor)'
    };
    return descriptions[circuit] || 'Unknown Circuit';
}

/**
 * Clear results and charts
 */
function clearResults() {
    if (isMeasuring) {
        if (!confirm('Measurement is in progress. Are you sure you want to clear results?')) {
            return;
        }
    }
    
    // Clear all charts
    Object.keys(charts).forEach(channelId => {
        updateChart(channelId, []);
    });
    
    measurementData = {};
    console.log('Results cleared');
}

