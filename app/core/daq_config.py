"""
DAQ Hardware Configuration
Defines all channel paths and relay configurations
"""
from typing import Dict
from app.core.config import settings


class DAQChannels:
    """DAQ channel configuration"""
    
    def __init__(self, daq_base: str):
        self.daq_base = daq_base
        
        # ADC Channels
        self.adc = {
            'ai0': f'{daq_base}Mod1/ai0',
            'ai1': f'{daq_base}Mod1/ai1',
            'ai2': f'{daq_base}Mod1/ai2',
            'ai3': f'{daq_base}Mod1/ai3',
            'all': f'{daq_base}Mod1/ai0:3'
        }
        
        # ZS1 Module (Mod2) - Digital Output Lines
        self.zs1 = {
            'line0': f'{daq_base}Mod2/port0/line0',
            'line1': f'{daq_base}Mod2/port0/line1',
            'line2': f'{daq_base}Mod2/port0/line2',
            'line3': f'{daq_base}Mod2/port0/line3',
        }
        
        # ZS2 Module (Mod3) - Digital Output Lines
        self.zs2 = {
            'line0': f'{daq_base}Mod3/port0/line0',
            'line1': f'{daq_base}Mod3/port0/line1',
            'line2': f'{daq_base}Mod3/port0/line2',
            'line3': f'{daq_base}Mod3/port0/line3',
        }
        
        # ZK1 Module (Mod4) - Digital Output Lines
        self.zk1 = {
            'line0': f'{daq_base}Mod4/port0/line0',
            'line1': f'{daq_base}Mod4/port0/line1',
            'line2': f'{daq_base}Mod4/port0/line2',
            'line3': f'{daq_base}Mod4/port0/line3',
            'line4': f'{daq_base}Mod4/port0/line4',
            'line5': f'{daq_base}Mod4/port0/line5',
            'line6': f'{daq_base}Mod4/port0/line6',
            'line7': f'{daq_base}Mod4/port0/line7',
        }
        
        # ZK2 Module (Mod5) - Digital Output Lines
        self.zk2 = {
            'line0': f'{daq_base}Mod5/port0/line0',
            'line1': f'{daq_base}Mod5/port0/line1',
            'line2': f'{daq_base}Mod5/port0/line2',
            'line3': f'{daq_base}Mod5/port0/line3',
            'line4': f'{daq_base}Mod5/port0/line4',
            'line5': f'{daq_base}Mod5/port0/line5',
            'line6': f'{daq_base}Mod5/port0/line6',
            'line7': f'{daq_base}Mod5/port0/line7',
        }
        
        # ZK3 Module (Mod6) - Digital Output Lines
        self.zk3 = {
            'line0': f'{daq_base}Mod6/port0/line0',
            'line1': f'{daq_base}Mod6/port0/line1',
            'line2': f'{daq_base}Mod6/port0/line2',
            'line3': f'{daq_base}Mod6/port0/line3',
            'line4': f'{daq_base}Mod6/port0/line4',
            'line5': f'{daq_base}Mod6/port0/line5',
            'line6': f'{daq_base}Mod6/port0/line6',
            'line7': f'{daq_base}Mod6/port0/line7',
        }
        
        # ZK4 Module (Mod7) - Digital Output Lines
        self.zk4 = {
            'line0': f'{daq_base}Mod7/port0/line0',
            'line1': f'{daq_base}Mod7/port0/line1',
            'line2': f'{daq_base}Mod7/port0/line2',
            'line3': f'{daq_base}Mod7/port0/line3',
            'line4': f'{daq_base}Mod7/port0/line4',
            'line5': f'{daq_base}Mod7/port0/line5',
            'line6': f'{daq_base}Mod7/port0/line6',
            'line7': f'{daq_base}Mod7/port0/line7',
        }


class RelayMapping:
    """Mapping of relay names to their physical channels"""
    
    def __init__(self, channels: DAQChannels):
        self.channels = channels
        
        # Relay name to channel mapping
        self.relays: Dict[str, str] = {
            # ZS1 relays
            'zs1_1': channels.zs1['line0'],
            'zs1_2': channels.zs1['line1'],
            
            # ZS2 relays  
            'zs2_1': channels.zs2['line0'],
            'zs2_2': channels.zs2['line1'],
            
            # ZK1 relays (Resistor connections)
            'zk1_5': channels.zk1['line4'],  # R1s1
            'zk1_8': channels.zk1['line7'],  # R1s4
            
            # ZK2 relays
            'zk2_1': channels.zk2['line0'],
            'zk2_5': channels.zk2['line4'],
        }
    
    def get_channel(self, relay_name: str) -> str:
        """Get channel path for a relay"""
        if relay_name not in self.relays:
            raise ValueError(f"Unknown relay: {relay_name}")
        return self.relays[relay_name]
    
    def get_all_relay_names(self) -> list:
        """Get list of all available relay names"""
        return list(self.relays.keys())


# Initialize global channel configuration
daq_channels = DAQChannels(settings.daq_device_name)
relay_mapping = RelayMapping(daq_channels)

