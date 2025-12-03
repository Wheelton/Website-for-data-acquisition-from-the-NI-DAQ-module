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
        
        # Relay name to channel mapping - ALL available relays
        self.relays: Dict[str, str] = {
            # ZS1 Module relays (Mod2)
            'zs1_1': channels.zs1['line0'],
            'zs1_2': channels.zs1['line1'],
            'zs1_3': channels.zs1['line2'],
            'zs1_4': channels.zs1['line3'],
            
            # ZS2 Module relays (Mod3)
            'zs2_1': channels.zs2['line0'],
            'zs2_2': channels.zs2['line1'],
            'zs2_3': channels.zs2['line2'],
            'zs2_4': channels.zs2['line3'],
            
            # ZK1 Module relays (Mod4)
            'zk1_1': channels.zk1['line0'],
            'zk1_2': channels.zk1['line1'],
            'zk1_3': channels.zk1['line2'],
            'zk1_4': channels.zk1['line3'],
            'zk1_5': channels.zk1['line4'],
            'zk1_6': channels.zk1['line5'],
            'zk1_7': channels.zk1['line6'],
            'zk1_8': channels.zk1['line7'],
            
            # ZK2 Module relays (Mod5)
            'zk2_1': channels.zk2['line0'],
            'zk2_2': channels.zk2['line1'],
            'zk2_3': channels.zk2['line2'],
            'zk2_4': channels.zk2['line3'],
            'zk2_5': channels.zk2['line4'],
            'zk2_6': channels.zk2['line5'],
            'zk2_7': channels.zk2['line6'],
            'zk2_8': channels.zk2['line7'],
            
            # ZK3 Module relays (Mod6)
            'zk3_1': channels.zk3['line0'],
            'zk3_2': channels.zk3['line1'],
            'zk3_3': channels.zk3['line2'],
            'zk3_4': channels.zk3['line3'],
            'zk3_5': channels.zk3['line4'],
            'zk3_6': channels.zk3['line5'],
            'zk3_7': channels.zk3['line6'],
            'zk3_8': channels.zk3['line7'],
            
            # ZK4 Module relays (Mod7)
            'zk4_1': channels.zk4['line0'],
            'zk4_2': channels.zk4['line1'],
            'zk4_3': channels.zk4['line2'],
            'zk4_4': channels.zk4['line3'],
            'zk4_5': channels.zk4['line4'],
            'zk4_6': channels.zk4['line5'],
            'zk4_7': channels.zk4['line6'],
            'zk4_8': channels.zk4['line7'],
        }
    
    def get_channel(self, relay_name: str) -> str:
        """Get channel path for a relay"""
        if relay_name not in self.relays:
            raise ValueError(f"Unknown relay: {relay_name}")
        return self.relays[relay_name]
    
    def get_all_relay_names(self) -> list:
        """Get list of all available relay names"""
        return list(self.relays.keys())
    
    def get_relays_by_module(self, module: str) -> Dict[str, str]:
        """
        Get all relays for a specific module
        
        Args:
            module: Module name ('zs1', 'zs2', 'zk1', 'zk2', 'zk3', 'zk4')
            
        Returns:
            Dictionary of relay names and their channels for the specified module
        """
        return {name: channel for name, channel in self.relays.items() 
                if name.startswith(module.lower() + '_')}


# Initialize global channel configuration
daq_channels = DAQChannels(settings.daq_device_name)
relay_mapping = RelayMapping(daq_channels)

