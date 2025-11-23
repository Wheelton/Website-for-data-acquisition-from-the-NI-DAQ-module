/**
 * NI DAQ Control Dashboard JavaScript
 * Handles circuit selection and schematic toggle
 */

let selectedCircuit = null;
let isExtendedView = false;
let isMeasuring = false;
let measurementTimer = null;

// Persistent measurement values (remember across circuit switches)
let measurementValues = {
    samples: 500,
    sampleRate: 100,
    measurementTime: 5
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
    
    // Hide all parameters first
    paramLs.style.display = 'none';
    paramCs.style.display = 'none';
    paramResistance.style.display = 'none';
    
    // Show parameters based on circuit type
    if (circuitType === 'rl') {
        // RL Circuit: Inductor + Resistor (2 parameters)
        paramLs.style.display = 'block';
        paramResistance.style.display = 'block';
        paramGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (circuitType === 'rc') {
        // RC Circuit: Capacitor + Resistor (2 parameters)
        paramCs.style.display = 'block';
        paramResistance.style.display = 'block';
        paramGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (circuitType === 'rlc') {
        // RLC Circuit: Inductor + Capacitor + Resistor (3 parameters)
        paramLs.style.display = 'block';
        paramCs.style.display = 'block';
        paramResistance.style.display = 'block';
        paramGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
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
    
    selectLs.value = '';
    selectCs.value = '';
    selectResistance.value = '';
    
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
    
    const selectedParams = {
        circuit: selectedCircuit,
        ls: selectLs.value || null,
        cs: selectCs.value || null,
        resistance: selectResistance.value || null
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
    
    console.log('Starting measurement...', {
        ...selectedParams,
        samples: measurementValues.samples,
        sampleRate: measurementValues.sampleRate,
        measurementTime: measurementValues.measurementTime
    });
    
    // Set automatic stop timer if measurement time is specified
    if (measurementValues.measurementTime > 0) {
        measurementTimer = setTimeout(() => {
            stopMeasurement();
            console.log('Measurement stopped automatically after ' + measurementValues.measurementTime + ' seconds');
        }, measurementValues.measurementTime * 1000);
    }
    
    // TODO: Implement actual data acquisition logic here
    // This will be connected to your backend API endpoints
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

