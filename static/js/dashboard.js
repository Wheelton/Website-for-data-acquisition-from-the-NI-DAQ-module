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
    
    // Add listeners for measurement inputs (for buffer warning)
    const inputSamples = document.getElementById('input-samples');
    const inputSampleRate = document.getElementById('input-sample-rate');
    const inputMeasurementTime = document.getElementById('input-measurement-time');
    
    if (inputSamples) {
        inputSamples.addEventListener('input', updateBufferWarning);
        inputSamples.addEventListener('change', updateBufferWarning);
    }
    if (inputSampleRate) {
        inputSampleRate.addEventListener('input', updateBufferWarning);
        inputSampleRate.addEventListener('change', updateBufferWarning);
    }
    if (inputMeasurementTime) {
        inputMeasurementTime.addEventListener('input', updateBufferWarning);
        inputMeasurementTime.addEventListener('change', updateBufferWarning);
    }
    
    // Initial validation
    validateParameters();
    updateBufferWarning();
}

/**
 * Update buffer size warning based on current input values
 */
function updateBufferWarning() {
    const inputSamples = document.getElementById('input-samples');
    const inputSampleRate = document.getElementById('input-sample-rate');
    const inputMeasurementTime = document.getElementById('input-measurement-time');
    const bufferWarning = document.getElementById('bufferWarning');
    const warningCurrentBuffer = document.getElementById('warningCurrentBuffer');
    const warningCalculatedBuffer = document.getElementById('warningCalculatedBuffer');
    
    if (!inputSamples || !inputSampleRate || !inputMeasurementTime || !bufferWarning) {
        return;
    }
    
    const samples = parseFloat(inputSamples.value) || 0;
    const sampleRate = parseFloat(inputSampleRate.value) || 0;
    const measurementTime = parseFloat(inputMeasurementTime.value) || 0;
    
    // Calculate required buffer size (same formula as backend)
    if (measurementTime > 0 && sampleRate > 0) {
        const calculatedBuffer = Math.floor(sampleRate * measurementTime * 1.15);
        
        // Show warning if calculated buffer is larger than user's input
        if (calculatedBuffer > samples) {
            warningCurrentBuffer.textContent = samples.toLocaleString();
            warningCalculatedBuffer.textContent = calculatedBuffer.toLocaleString();
            bufferWarning.style.display = 'flex';
        } else {
            bufferWarning.style.display = 'none';
        }
    } else {
        bufferWarning.style.display = 'none';
    }
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
    if (!samplesValue || samplesValue < 100 || samplesValue > 500000) {
        missingParams.push('Samples');
        showError(inputSamples, 'error-samples');
        allValid = false;
    } else {
        hideError(inputSamples, 'error-samples');
    }
    
    const sampleRateValue = parseFloat(inputSampleRate.value);
    if (!sampleRateValue || sampleRateValue < 1 || sampleRateValue > 1000000) {
        missingParams.push('Sample Rate');
        showError(inputSampleRate, 'error-sample-rate');
        allValid = false;
    } else {
        hideError(inputSampleRate, 'error-sample-rate');
    }
    
    const measurementTimeValue = parseFloat(inputMeasurementTime.value);
    if (!measurementTimeValue || measurementTimeValue < 0.01 || measurementTimeValue > 10) {
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
    
    // Update buffer warning with restored values
    updateBufferWarning();
}

/**
 * Handle measurement input changes
 */
function handleMeasurementInput() {
    saveMeasurementValues();
    validateParameters();
    updateBufferWarning();
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

// ============== Component to Relay Mappings ==============

/**
 * Component to relay mappings
 * Maps circuit component selections to their corresponding relay names
 */
const componentRelayMappings = {
    // Inductor (Ls) mappings - UPDATE THESE WITH CORRECT RELAY NAMES
    inductors: {
        'ls1': 'zk1_1',  // 1/0.5 [mH/Ω]
        'ls2': 'zk1_2',  // 10/2.5 [mH/Ω]
        'ls3': 'zk1_3',  // 75.6/50.1 [mH/Ω]
        'ls4': 'zk1_4'   // ~0.6/1 [H/Ω]
    },
    
    // Capacitor (Cs) mappings - VERIFIED FROM BACKEND
    capacitors: {
        'cs1': 'zk2_1',  // 48 μF
        'cs2': 'zk2_2',  // 9.5 μF
        'cs3': 'zk2_3',  // 1 μF
        'cs4': 'zk2_4'   // 222 nF
    },
    
    // Resistor (R1s) mappings - UPDATE THESE WITH CORRECT RELAY NAMES
    resistorsR1s: {
        'r1s1': 'zk1_5',  // 4.9 Ω
        'r1s2': 'zk1_6',  // 56.8 Ω
        'r1s3': 'zk1_7',  // 739 Ω
        'r1s4': 'zk1_8'   // 26.9 kΩ
    },
    
    // Resistor (R2r) mappings - UPDATE THESE WITH CORRECT RELAY NAMES
    resistorsR2r: {
        'r2r1': 'zk4_1',  // 14.9 Ω
        'r2r2': 'zk4_2',  // 32.9 Ω
        'r2r3': 'zk4_3',  // 4.91 kΩ
        'r2r4': 'zk4_4'   // 47.4 kΩ
    },
    
    // Discharge resistor mappings - VERIFIED FROM BACKEND
    dischargeResistors: {
        'rz1': 'zk2_5',  // 3 Ω (R2s1)
        'rz2': 'zk2_6',  // 21.7 Ω (R2s2) - DEFAULT
        'rz3': 'zk2_7',  // 357 Ω (R2s3)
        'rz4': 'zk2_8'   // 2.18 kΩ (R2s4)
    },
    
    // Circuit-specific additional relays
    circuitSpecificRelays: {
        'rl': 'zs1_4',   // Enable zs1_4 for LR circuits
        'rc': 'zs1_2',   // Enable zs1_2 for RC circuits
        'rlc': 'zs1_4'   // Enable zs1_4 for RLC circuits (same as RL)
    }
};

/**
 * Get relay name for a component selection
 * @param {string} component - Component identifier (e.g., 'ls1', 'cs2', 'r1s3')
 * @returns {string|null} Relay name or null if not found
 */
function getRelayForComponent(component) {
    if (!component) return null;
    
    const lower = component.toLowerCase();
    
    // Check inductors
    if (lower.startsWith('ls')) {
        return componentRelayMappings.inductors[lower] || null;
    }
    
    // Check capacitors
    if (lower.startsWith('cs')) {
        return componentRelayMappings.capacitors[lower] || null;
    }
    
    // Check R1s resistors
    if (lower.startsWith('r1s')) {
        return componentRelayMappings.resistorsR1s[lower] || null;
    }
    
    // Check R2r resistors
    if (lower.startsWith('r2r')) {
        return componentRelayMappings.resistorsR2r[lower] || null;
    }
    
    // Check discharge resistors
    if (lower.startsWith('rz')) {
        return componentRelayMappings.dischargeResistors[lower] || null;
    }
    
    return null;
}

/**
 * Start measurement with complete workflow
 * Implements the full measurement sequence as specified in requirements
 */
async function startMeasurement() {
    if (!selectedCircuit) {
        showErrorDialog('Error', 'Please select a circuit first');
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
        dischargeResistor: selectDischarge.value || 'rz2'  // Default to rz2 if not specified
    };
    
    // Save current values
    saveMeasurementValues();
    
    // Update button states - disable start button immediately
    const startBtn = document.getElementById('btnStartMeasurement');
    const stopBtn = document.getElementById('btnStopMeasurement');
    
    startBtn.disabled = true;
    startBtn.setAttribute('data-tooltip', 'Measurement workflow in progress...');
    
    // Keep stop button disabled until ADC is started
    stopBtn.disabled = true;
    stopBtn.setAttribute('data-tooltip', 'Waiting for measurement to start...');
    
    // Show results section and initialize charts
    showResultsSection();
    initializeCharts();
    
    console.log('🚀 Starting measurement workflow...', {
        ...selectedParams,
        samples: measurementValues.samples,
        sampleRate: measurementValues.sampleRate,
        measurementTime: measurementValues.measurementTime
    });
    
    try {
        // ========== STEP 1: Disable any enabled relays (twice) ==========
        console.log('📋 Step 1: Disabling all enabled relays (pass 1)...');
        let response = await fetch('/api/relays/disable-enabled', { method: 'POST' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to disable relays (pass 1): ${error.detail || response.statusText}`);
        }
        console.log('✅ Pass 1 complete');
        
        console.log('📋 Step 1: Disabling all enabled relays (pass 2)...');
        response = await fetch('/api/relays/disable-enabled', { method: 'POST' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to disable relays (pass 2): ${error.detail || response.statusText}`);
        }
        console.log('✅ Pass 2 complete');
        
        // ========== STEP 2: Discharge all capacitors ==========
        console.log('📋 Step 2: Discharging all capacitors...');
        const capacitorsToDischarge = ['cs1', 'cs2', 'cs3', 'cs4'];
        const chosenCapacitor = selectedParams.cs;
        const dischargeResistor = selectedParams.dischargeResistor;
        
        for (const capacitor of capacitorsToDischarge) {
            // Use the chosen discharge resistor for the chosen capacitor, or zk2_6 (rz2) for others
            const resistor = (capacitor === chosenCapacitor && dischargeResistor) 
                ? dischargeResistor 
                : 'rz2';
            
            console.log(`  Discharging ${capacitor.toUpperCase()} through ${resistor.toUpperCase()}...`);
            
            response = await fetch('/api/discharge-capacitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    capacitor: capacitor,
                    discharge_resistor: resistor,
                    duration: 0.2
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to discharge ${capacitor}: ${error.detail || response.statusText}`);
            }
            
            console.log(`  ✅ ${capacitor.toUpperCase()} discharged`);
        }
        console.log('✅ All capacitors discharged');
        
        // ========== STEP 3: Connect chosen circuit ==========
        console.log('📋 Step 3: Connecting circuit components...');
        const relaysToEnable = {};
        
        // Add circuit-specific relay (zs1_4 for RL/RLC, zs1_2 for RC)
        const circuitSpecificRelay = componentRelayMappings.circuitSpecificRelays[selectedCircuit];
        if (circuitSpecificRelay) {
            relaysToEnable[circuitSpecificRelay] = true;
            console.log(`  Added circuit-specific relay: ${circuitSpecificRelay}`);
        }
        
        // Add component relays based on circuit type
        if (selectedCircuit === 'rl') {
            // RL Circuit: Inductor + Resistor
            const lsRelay = getRelayForComponent(selectedParams.ls);
            const rRelay = getRelayForComponent(selectedParams.resistance);
            
            if (lsRelay) {
                relaysToEnable[lsRelay] = true;
                console.log(`  Added inductor relay: ${lsRelay} (${selectedParams.ls})`);
            }
            if (rRelay) {
                relaysToEnable[rRelay] = true;
                console.log(`  Added resistor relay: ${rRelay} (${selectedParams.resistance})`);
                
                // If R2r resistor is selected, also enable zs1_3
                if (selectedParams.resistance && selectedParams.resistance.toLowerCase().startsWith('r2r')) {
                    relaysToEnable['zs1_3'] = true;
                    console.log(`  Added zs1_3 (required for R2r resistors)`);
                }
            }
        } else if (selectedCircuit === 'rc') {
            // RC Circuit: Capacitor + Resistor
            const csRelay = getRelayForComponent(selectedParams.cs);
            const rRelay = getRelayForComponent(selectedParams.resistance);
            
            if (csRelay) {
                relaysToEnable[csRelay] = true;
                console.log(`  Added capacitor relay: ${csRelay} (${selectedParams.cs})`);
            }
            if (rRelay) {
                relaysToEnable[rRelay] = true;
                console.log(`  Added resistor relay: ${rRelay} (${selectedParams.resistance})`);
                
                // If R2r resistor is selected, also enable zs1_3
                if (selectedParams.resistance && selectedParams.resistance.toLowerCase().startsWith('r2r')) {
                    relaysToEnable['zs1_3'] = true;
                    console.log(`  Added zs1_3 (required for R2r resistors)`);
                }
            }
        } else if (selectedCircuit === 'rlc') {
            // RLC Circuit: Inductor + Capacitor + Resistor
            const lsRelay = getRelayForComponent(selectedParams.ls);
            const csRelay = getRelayForComponent(selectedParams.cs);
            const rRelay = getRelayForComponent(selectedParams.resistance);
            
            if (lsRelay) {
                relaysToEnable[lsRelay] = true;
                console.log(`  Added inductor relay: ${lsRelay} (${selectedParams.ls})`);
            }
            if (csRelay) {
                relaysToEnable[csRelay] = true;
                console.log(`  Added capacitor relay: ${csRelay} (${selectedParams.cs})`);
            }
            if (rRelay) {
                relaysToEnable[rRelay] = true;
                console.log(`  Added resistor relay: ${rRelay} (${selectedParams.resistance})`);
                
                // If R2r resistor is selected, also enable zs1_3
                if (selectedParams.resistance && selectedParams.resistance.toLowerCase().startsWith('r2r')) {
                    relaysToEnable['zs1_3'] = true;
                    console.log(`  Added zs1_3 (required for R2r resistors)`);
                }
            }
        }
        
        // Enable all circuit relays
        if (Object.keys(relaysToEnable).length > 0) {
            console.log(`  Enabling ${Object.keys(relaysToEnable).length} relay(s)...`);
            response = await fetch('/api/relays/multiple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relay_states: relaysToEnable })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to enable circuit relays: ${error.detail || response.statusText}`);
            }
            console.log('✅ Circuit relays enabled');
        } else {
            console.warn('⚠️  No relays to enable - check component mappings');
        }
        
        // ========== STEP 4: Power the circuit (enable zs1_1) ==========
        console.log('📋 Step 4: Powering circuit (enabling zs1_1)...');
        response = await fetch('/api/relay/zs1_1/true', { method: 'POST' });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to enable zs1_1: ${error.detail || response.statusText}`);
        }
        console.log('✅ Circuit powered (zs1_1 enabled)');
        
        // ========== STEP 5: Start ADC acquisition ==========
        console.log('📋 Step 5: Starting ADC acquisition...');
        const adcParams = new URLSearchParams({
            samples: measurementValues.samples,
            sample_rate: measurementValues.sampleRate,
            measurement_time: measurementValues.measurementTime || 0
        });
        
        response = await fetch(`/api/start-read-adc?${adcParams}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to start ADC: ${error.detail || response.statusText}`);
        }
        
        const adcResult = await response.json();
        console.log('✅ ADC acquisition started:', adcResult);
        
        // NOW enable stop button since ADC is running
        isMeasuring = true;
        stopBtn.disabled = false;
        stopBtn.setAttribute('data-tooltip', 'Click to stop the ongoing measurement');
        
        // ========== STEP 6: Wait for measurement or stop button ==========
        console.log('📊 Measurement in progress...');
        console.log(`⏱️  Waiting for ${measurementValues.measurementTime}s or stop button click...`);
        
        // Scroll to results section
        setTimeout(() => {
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 200);
        
        // Set up automatic stop timer if measurement time is specified
        if (measurementValues.measurementTime > 0) {
            measurementTimer = setTimeout(async () => {
                console.log('⏱️  Measurement time elapsed, stopping automatically...');
                await completeMeasurement();
            }, measurementValues.measurementTime * 1000);
        }
        
    } catch (error) {
        console.error('❌ Measurement workflow error:', error);
        
        // Try to clean up on error
        try {
            // Try to stop ADC if it was started
            if (isMeasuring) {
                try {
                    await fetch('/api/stop-read-adc', { method: 'POST' });
                } catch (e) {
                    // Ignore if ADC wasn't running
                }
            }
            // Always try to disable relays
            await fetch('/api/relays/disable-enabled', { method: 'POST' });
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
        
        // Reset state
        isMeasuring = false;
        if (measurementTimer) {
            clearTimeout(measurementTimer);
            measurementTimer = null;
        }
        
        // Reset button states
        startBtn.disabled = false;
        startBtn.setAttribute('data-tooltip', 'Ready to start measurement');
        stopBtn.disabled = true;
        stopBtn.setAttribute('data-tooltip', 'No active measurement to stop');
        
        // Show error to user
        showErrorDialog('Measurement Error', error.message || String(error));
    }
}

/**
 * Complete the measurement (called by timer or stop button)
 * Steps 7-9 of the workflow
 */
async function completeMeasurement() {
    console.log('📋 Completing measurement...');
    
    try {
        // ========== STEP 7: Stop ADC and get data ==========
        console.log('📋 Step 7: Stopping ADC and retrieving data...');
        let response = await fetch('/api/stop-read-adc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to stop ADC: ${error.detail || response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ ADC stopped, data received:', result);
        console.log(`📊 Received ${result.samples} samples from ${result.channels} channels`);
        
        // Update charts with data
        updateChartsWithData(result.data);
        
        // ========== STEP 8: Disable circuit power (zs1_1) ==========
        console.log('📋 Step 8: Disabling circuit power (zs1_1)...');
        response = await fetch('/api/relay/zs1_1/false', { method: 'POST' });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to disable zs1_1: ${error.detail || response.statusText}`);
        }
        console.log('✅ Circuit power disabled');
        
        // ========== STEP 9: Disable all enabled relays ==========
        console.log('📋 Step 9: Disabling all enabled relays...');
        response = await fetch('/api/relays/disable-enabled', { method: 'POST' });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to disable relays: ${error.detail || response.statusText}`);
        }
        console.log('✅ All relays disabled');
        
        // ========== SUCCESS ==========
        console.log('✅ Measurement completed successfully!');
        showSuccessDialog('Measurement Complete', 'The measurement has been completed successfully. Data is now displayed in the charts below.');
        
    } catch (error) {
        console.error('❌ Error completing measurement:', error);
        showErrorDialog('Completion Error', error.message || String(error));
    } finally {
        // Always reset state
        isMeasuring = false;
        if (measurementTimer) {
            clearTimeout(measurementTimer);
            measurementTimer = null;
        }
        
        // Reset button states
        const startBtn = document.getElementById('btnStartMeasurement');
        const stopBtn = document.getElementById('btnStopMeasurement');
        
        stopBtn.disabled = true;
        stopBtn.setAttribute('data-tooltip', 'No active measurement to stop');
        
        // Re-validate to enable start button if parameters are valid
        validateParameters();
    }
}

/**
 * Stop measurement (user-triggered)
 */
async function stopMeasurement() {
    if (!isMeasuring) {
        console.warn('No measurement is currently running');
        return;
    }
    
    console.log('🛑 User requested measurement stop...');
    
    // Clear automatic stop timer
    if (measurementTimer) {
        clearTimeout(measurementTimer);
        measurementTimer = null;
    }
    
    // Complete the measurement workflow
    await completeMeasurement();
}

/**
 * Show error dialog
 * @param {string} title - Dialog title
 * @param {string} message - Error message
 */
function showErrorDialog(title, message) {
    alert(`❌ ${title}\n\n${message}\n\nPlease review the console for more details.`);
}

/**
 * Show success dialog
 * @param {string} title - Dialog title
 * @param {string} message - Success message
 */
function showSuccessDialog(title, message) {
    alert(`✅ ${title}\n\n${message}`);
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
 * Sync measurement state with backend
 * Checks if backend has an active acquisition and updates UI accordingly
 */
async function syncMeasurementState() {
    try {
        const response = await fetch('/api/adc-status');
        if (!response.ok) {
            console.warn('Could not sync measurement state with backend');
            return;
        }
        
        const status = await response.json();
        console.log('Backend measurement status:', status);
        
        // If backend says no acquisition is running, ensure frontend reflects that
        if (!status.is_running && isMeasuring) {
            console.log('Syncing state: Backend has no active acquisition');
            isMeasuring = false;
            if (measurementTimer) {
                clearTimeout(measurementTimer);
                measurementTimer = null;
            }
            validateParameters();
        }
    } catch (error) {
        console.error('Error syncing measurement state:', error);
    }
}

/**
 * Legacy function kept for backwards compatibility
 * NOTE: The main measurement workflow is now in startMeasurement()
 */
async function startAdcAcquisition() {
    console.warn('startAdcAcquisition() is deprecated. Use startMeasurement() instead.');
}

/**
 * Legacy function kept for backwards compatibility
 * NOTE: The main measurement workflow is now in startMeasurement() and completeMeasurement()
 */
async function stopAdcAcquisition() {
    console.warn('stopAdcAcquisition() is deprecated. Use stopMeasurement() instead.');
}

/**
 * Simulate measurement data for testing
 * NOTE: This function is kept for future reference but is not currently used
 * The application now uses real data from the backend API
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
 * Update charts with real data from backend
 */
function updateChartsWithData(data) {
    // Map ADC channels to chart IDs based on selected circuit
    const channelMappings = {
        'rl': [
            { adc: 'adc1', chartId: 'ch1' },
            { adc: 'adc2', chartId: 'ch2' },
            { adc: 'adc3', chartId: 'ch3' },
            { adc: 'adc4', chartId: 'ch4' }
        ],
        'rc': [
            { adc: 'adc1', chartId: 'ch1' },
            { adc: 'adc2', chartId: 'ch2' },
            { adc: 'adc3', chartId: 'ch3' },
            { adc: 'adc4', chartId: 'ch4' }
        ],
        'rlc': [
            { adc: 'adc1', chartId: 'ch1' },
            { adc: 'adc2', chartId: 'ch2' },
            { adc: 'adc3', chartId: 'ch3' },
            { adc: 'adc4', chartId: 'ch4' }
        ]
    };
    
    const mapping = channelMappings[selectedCircuit] || [];
    
    // Update each chart with corresponding ADC data
    mapping.forEach(({ adc, chartId }) => {
        if (data[adc] && charts[chartId]) {
            updateChart(chartId, data[adc]);
        }
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

