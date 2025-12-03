"""
Relay Control Service
Handles switching relays on/off
"""
import nidaqmx as ni
from typing import List
from app.core.daq_config import relay_mapping
from app.core.config import settings


class RelayService:
    """Service for controlling relay switches"""
    
    def __init__(self):
        self.relay_mapping = relay_mapping
        # Track relay states (all start as False/OFF)
        self._relay_states = {relay: False for relay in self.relay_mapping.get_all_relay_names()}
        # Detect if we're using simulated device (cDAQ1 doesn't support reading DO states)
        self.is_simulated = settings.daq_device_name.lower() in ['cdaq1', 'dev1', 'sim']
        if self.is_simulated:
            print(f"⚠️  Using simulated device '{settings.daq_device_name}' - relay states will be tracked in memory only")
    
    def control_relay(self, relay_name: str, state: bool) -> str:
        """
        Control a specific relay
        
        Args:
            relay_name: Name of the relay (e.g., 'zs1_1', 'zk1_5')
            state: True to turn on, False to turn off
            
        Returns:
            Status message string
            
        Raises:
            ValueError: If relay name is unknown
        """
        channel = self.relay_mapping.get_channel(relay_name)
        
        with ni.Task() as task:
            task.do_channels.add_do_chan(channel)
            task.write(state)
        
        # Update state tracking
        self._relay_states[relay_name] = state
        
        info = f'{relay_name} {"ON" if state else "OFF"}'
        print(info)
        return info
    
    def get_available_relays(self) -> List[str]:
        """
        Get list of all available relay names
        
        Returns:
            List of relay names (56 total relays across 6 modules)
        """
        return self.relay_mapping.get_all_relay_names()
    
    def get_relays_by_module(self, module: str) -> List[str]:
        """
        Get list of relay names for a specific module
        
        Args:
            module: Module name ('zs1', 'zs2', 'zk1', 'zk2', 'zk3', 'zk4')
            
        Returns:
            List of relay names for the specified module
        """
        relays_dict = self.relay_mapping.get_relays_by_module(module)
        return list(relays_dict.keys())
    
    def control_multiple_relays(self, relay_states: dict) -> str:
        """
        Control multiple relays at once
        
        Args:
            relay_states: Dictionary of {relay_name: state} pairs
            
        Returns:
            Status message string
            
        Example:
            control_multiple_relays({
                'zs1_1': True,
                'zk1_5': False,
                'zk2_1': True
            })
        """
        results = []
        for relay_name, state in relay_states.items():
            result = self.control_relay(relay_name, state)
            results.append(result)
        
        return "; ".join(results)
    
    # Convenience methods for commonly used relays in acquisition sequences
    def zs1_1(self, state: bool) -> str:
        """Control ZS1_1 relay (Main power)"""
        return self.control_relay('zs1_1', state)
    
    def zs1_2(self, state: bool) -> str:
        """Control ZS1_2 relay (ADC1 short circuit)"""
        return self.control_relay('zs1_2', state)
    
    def zs2_1(self, state: bool) -> str:
        """Control ZS2_1 relay (GND connection)"""
        return self.control_relay('zs2_1', state)
    
    def zs2_2(self, state: bool) -> str:
        """Control ZS2_2 relay (Discharge circuit)"""
        return self.control_relay('zs2_2', state)
    
    def zk1_5(self, state: bool) -> str:
        """Control ZK1_5 relay (R1s1 resistor)"""
        return self.control_relay('zk1_5', state)
    
    def zk1_8(self, state: bool) -> str:
        """Control ZK1_8 relay (R1s4 resistor)"""
        return self.control_relay('zk1_8', state)
    
    def zk2_1(self, state: bool) -> str:
        """Control ZK2_1 relay (Cs1 capacitor)"""
        return self.control_relay('zk2_1', state)
    
    def zk2_5(self, state: bool) -> str:
        """Control ZK2_5 relay (R2s1 discharge resistor)"""
        return self.control_relay('zk2_5', state)
    
    def get_relay_state(self, relay_name: str) -> bool:
        """
        Get the current state of a specific relay
        
        For real hardware: Reads from hardware
        For simulated devices: Returns internal state (simulated devices don't support DO reads)
        
        Args:
            relay_name: Name of the relay
            
        Returns:
            Current state (True = ON, False = OFF)
            
        Raises:
            ValueError: If relay name is unknown
        """
        if relay_name not in self._relay_states:
            raise ValueError(f"Unknown relay: {relay_name}")
        
        # For simulated devices, return internal state (they don't support reading DO)
        if self.is_simulated:
            return self._relay_states[relay_name]
        
        # For real hardware, read from device
        channel = self.relay_mapping.get_channel(relay_name)
        
        try:
            with ni.Task() as task:
                task.do_channels.add_do_chan(channel)
                # Read the current state from hardware
                state = task.read()
                # Update internal state to match hardware
                self._relay_states[relay_name] = state
                return state
        except Exception as e:
            # If hardware read fails, fall back to internal state
            print(f"Warning: Could not read relay {relay_name} from hardware: {e}")
            return self._relay_states.get(relay_name, False)
    
    def get_all_relay_states(self) -> dict:
        """
        Get the current state of all relays
        
        For real hardware: Reads from hardware
        For simulated devices: Returns internal state (simulated devices don't support DO reads)
        
        Returns:
            Dictionary of {relay_name: state} for all relays
        """
        # For simulated devices, return internal state (they don't support reading DO)
        if self.is_simulated:
            return self._relay_states.copy()
        
        # For real hardware, read from device
        hardware_states = {}
        
        for relay_name in self._relay_states.keys():
            try:
                channel = self.relay_mapping.get_channel(relay_name)
                with ni.Task() as task:
                    task.do_channels.add_do_chan(channel)
                    # Read the current state from hardware
                    state = task.read()
                    hardware_states[relay_name] = state
                    # Update internal state to match hardware
                    self._relay_states[relay_name] = state
            except Exception as e:
                # If hardware read fails, use internal state
                print(f"Warning: Could not read relay {relay_name} from hardware: {e}")
                hardware_states[relay_name] = self._relay_states.get(relay_name, False)
        
        return hardware_states
    
    def get_enabled_relays(self) -> List[str]:
        """
        Get list of all currently enabled (ON) relays
        
        For real hardware: Reads from hardware
        For simulated devices: Returns from internal state
        
        Returns:
            List of relay names that are currently ON
        """
        # Get states (from hardware or internal depending on mode)
        states = self.get_all_relay_states()
        return [name for name, state in states.items() if state]
    
    def disable_all_relays(self) -> str:
        """
        Turn off all relays
        
        For real hardware: Checks hardware state first
        For simulated devices: Uses internal state
        
        Returns:
            Status message string
        """
        disabled_count = 0
        # Get states (from hardware or internal depending on mode)
        states = self.get_all_relay_states()
        
        for relay_name, state in states.items():
            if state:  # Only disable if currently ON in hardware
                self.control_relay(relay_name, False)
                disabled_count += 1
        
        message = f"Disabled {disabled_count} relay(s)"
        print(message)
        return message
    
    def disable_enabled_relays(self) -> tuple:
        """
        Turn off only the relays that are currently enabled
        
        Returns:
            Tuple of (list of disabled relay names, count)
        """
        enabled = self.get_enabled_relays()
        for relay_name in enabled:
            self.control_relay(relay_name, False)
        
        return enabled, len(enabled)
    
    def sync_with_hardware(self) -> dict:
        """
        Synchronize internal relay states with actual hardware states
        This is useful on application startup to detect relays left in ON state
        
        For simulated devices: Returns internal state (no actual hardware to sync with)
        For real hardware: Reads and syncs with hardware
        
        Returns:
            Dictionary of {relay_name: state} reflecting hardware/internal state
        """
        if self.is_simulated:
            print("⚠️  Simulated device mode - returning internal state (hardware read not supported)")
        else:
            print("Syncing relay states with hardware...")
        
        hardware_states = self.get_all_relay_states()
        
        enabled_count = sum(1 for state in hardware_states.values() if state)
        
        if self.is_simulated:
            print(f"Internal state: {enabled_count} relay(s) currently enabled")
        else:
            print(f"Sync complete: {enabled_count} relay(s) currently enabled in hardware")
        
        return hardware_states


relay_service = RelayService()

