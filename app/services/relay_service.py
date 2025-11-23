"""
Relay Control Service
Handles switching relays on/off
"""
import nidaqmx as ni
from typing import List
from app.core.daq_config import relay_mapping


class RelayService:
    """Service for controlling relay switches"""
    
    def __init__(self):
        self.relay_mapping = relay_mapping
    
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
        
        info = f'{relay_name} {"ON" if state else "OFF"}'
        print(info)
        return info
    
    def get_available_relays(self) -> List[str]:
        """
        Get list of all available relay names
        
        Returns:
            List of relay names
        """
        return self.relay_mapping.get_all_relay_names()
    
    # Individual relay control methods for backward compatibility
    def zs1_1(self, state: bool) -> str:
        """Control ZS1_1 relay"""
        return self.control_relay('zs1_1', state)
    
    def zs1_2(self, state: bool) -> str:
        """Control ZS1_2 relay"""
        return self.control_relay('zs1_2', state)
    
    def zs2_1(self, state: bool) -> str:
        """Control ZS2_1 relay"""
        return self.control_relay('zs2_1', state)
    
    def zs2_2(self, state: bool) -> str:
        """Control ZS2_2 relay"""
        return self.control_relay('zs2_2', state)
    
    def zk1_5(self, state: bool) -> str:
        """Control ZK1_5 relay (R1s1 resistor)"""
        return self.control_relay('zk1_5', state)
    
    def zk1_8(self, state: bool) -> str:
        """Control ZK1_8 relay (R1s4 resistor)"""
        return self.control_relay('zk1_8', state)
    
    def zk2_1(self, state: bool) -> str:
        """Control ZK2_1 relay"""
        return self.control_relay('zk2_1', state)
    
    def zk2_5(self, state: bool) -> str:
        """Control ZK2_5 relay"""
        return self.control_relay('zk2_5', state)


relay_service = RelayService()

