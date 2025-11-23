/**
 * NI DAQ Control Dashboard JavaScript
 * Handles circuit selection and schematic toggle
 */

let selectedCircuit = null;
let isExtendedView = false;

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
}

/**
 * Hide parameter selection section
 */
function hideParameterSection() {
    const paramSection = document.getElementById('parameterSection');
    paramSection.style.display = 'none';
    
    // Reset all select values
    document.getElementById('select-ls').value = '';
    document.getElementById('select-cs').value = '';
    document.getElementById('select-resistance').value = '';
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

