"""
Data Acquisition Service
Handles capacitor charging and data reading from ADC channels
"""
import time
import nidaqmx as ni
from nidaqmx.constants import AcquisitionType
from typing import List, Tuple
from app.core.daq_config import daq_channels
from app.services.relay_service import relay_service


class AcquisitionService:
    """Service for data acquisition operations"""
    
    def __init__(self):
        self.channels = daq_channels
        self.relay_service = relay_service
        
        # Capacitor to relay mapping
        self.capacitor_relays = {
            'cs1': 'zk2_1',  # 48 μF
            'cs2': 'zk2_2',  # 9.5 μF
            'cs3': 'zk2_3',  # 1 μF
            'cs4': 'zk2_4',  # 222 nF
        }
        
        # Discharge resistor to relay mapping
        self.discharge_resistor_relays = {
            'rz1': 'zk2_5',  # 3 Ω (R2s1)
            'rz2': 'zk2_6',  # 21.7 Ω (R2s2)
            'rz3': 'zk2_7',  # 357 Ω (R2s3)
            'rz4': 'zk2_8',  # 2.18 kΩ (R2s4)
        }
    
    def charge_capacitor(self, capacitor: str = 'cs1'):
        """
        Execute capacitor charging sequence for specified capacitor
        
        Args:
            capacitor: Capacitor identifier ('cs1', 'cs2', 'cs3', or 'cs4')
                      cs1 = 48 μF
                      cs2 = 9.5 μF
                      cs3 = 1 μF
                      cs4 = 222 nF
        
        Sequence:
        1. Discharge phase (short circuit through resistor)
        2. Charging phase (connect to power supply)
        
        Raises:
            ValueError: If capacitor identifier is invalid
            
        Note: After data collection, remember to turn off main relay (zs1_1)
        """
        # Validate capacitor
        capacitor_lower = capacitor.lower()
        if capacitor_lower not in self.capacitor_relays:
            raise ValueError(f"Invalid capacitor '{capacitor}'. Must be one of: {', '.join(self.capacitor_relays.keys())}")
        
        capacitor_relay = self.capacitor_relays[capacitor_lower]
        
        # -------------- Discharge phase --------------
        self.relay_service.zs1_1(False)  # Main power OFF
        self.relay_service.zs1_2(True)   # ADC1 short circuit
        self.relay_service.zk1_5(True)   # R_1_1 ON
        self.relay_service.zk1_8(False)  # R1s4 OFF
        self.relay_service.control_relay(capacitor_relay, True)  # Selected capacitor ON
        self.relay_service.zs2_1(True)   # GND ON
        self.relay_service.zs2_2(True)   # Discharge circuit short
        self.relay_service.zk2_5(True)   # Short through resistor R2s_1
        
        time.sleep(0.5)  # Wait for discharge
        
        self.relay_service.zs2_2(False)  # Discharge circuit OFF
        self.relay_service.zk2_5(False)  # R2s_1 OFF
        
        # -------------- Charging phase --------------
        self.relay_service.zk1_5(False)  # R_1_1 OFF
        self.relay_service.zk1_8(True)   # R1s4 ON
        self.relay_service.zs1_1(True)   # Main power ON
        
        # NOTE: After data collection, turn OFF main power with:
        # self.relay_service.zs1_1(False)
    
    def charge_capacitor_cs1(self):
        """
        Execute capacitor Cs1 charging sequence (backward compatibility)
        
        This method is kept for backward compatibility.
        Use charge_capacitor('cs1') instead.
        """
        self.charge_capacitor('cs1')
    
    def discharge_capacitor(self, capacitor: str = 'cs1', discharge_resistor: str = 'rz2', duration: float = 0.5):
        """
        Execute capacitor discharge sequence through specified discharge resistor
        
        Args:
            capacitor: Capacitor identifier ('cs1', 'cs2', 'cs3', or 'cs4')
                      cs1 = 48 μF
                      cs2 = 9.5 μF
                      cs3 = 1 μF
                      cs4 = 222 nF
            discharge_resistor: Discharge resistor identifier ('rz1', 'rz2', 'rz3', or 'rz4')
                               rz1 = 3 Ω
                               rz2 = 21.7 Ω (default - R2s2)
                               rz3 = 357 Ω
                               rz4 = 2.18 kΩ
            duration: Discharge duration in seconds (default: 0.5)
        
        Raises:
            ValueError: If capacitor or discharge_resistor identifier is invalid
            
        Note: All relays are turned off after discharge
        """
        # Validate capacitor
        capacitor_lower = capacitor.lower()
        if capacitor_lower not in self.capacitor_relays:
            raise ValueError(f"Invalid capacitor '{capacitor}'. Must be one of: {', '.join(self.capacitor_relays.keys())}")
        
        # Validate discharge resistor
        discharge_resistor_lower = discharge_resistor.lower()
        if discharge_resistor_lower not in self.discharge_resistor_relays:
            raise ValueError(f"Invalid discharge resistor '{discharge_resistor}'. Must be one of: {', '.join(self.discharge_resistor_relays.keys())}")
        
        capacitor_relay = self.capacitor_relays[capacitor_lower]
        discharge_relay = self.discharge_resistor_relays[discharge_resistor_lower]
        
        # -------------- Discharge phase --------------
        self.relay_service.zs1_1(False)  # Main power OFF
        self.relay_service.zs1_2(True)   # ADC1 short circuit
        self.relay_service.zk1_5(True)   # R_1_1 ON
        self.relay_service.control_relay(capacitor_relay, True)  # Selected capacitor ON
        self.relay_service.zs2_1(True)   # GND ON
        self.relay_service.zs2_2(True)   # Discharge circuit short
        self.relay_service.control_relay(discharge_relay, True)  # Selected discharge resistor ON
        
        time.sleep(duration)  # Wait for discharge
        
        # Turn off all relays
        self.relay_service.zs2_2(False)  # Discharge circuit OFF
        self.relay_service.control_relay(discharge_relay, False)  # Discharge resistor OFF
        self.relay_service.zk1_5(False)  # R_1_1 OFF
        self.relay_service.zs1_2(False)  # ADC1 short circuit OFF
        self.relay_service.control_relay(capacitor_relay, False)  # Capacitor OFF
        self.relay_service.zs2_1(False)  # GND OFF
    
    def read_adc_data(
        self, 
        samples_per_channel: int = 500, 
        sample_rate: int = 100,
        charge_first: bool = False,
        capacitor: str = 'cs1'
    ) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Read data from all 4 ADC channels
        
        Args:
            samples_per_channel: Number of samples to read per channel
            sample_rate: Sampling rate in Hz
            charge_first: If True, charge capacitor before reading
            capacitor: Capacitor to charge if charge_first is True (default: 'cs1')
            
        Returns:
            Tuple of (adc1_data, adc2_data, adc3_data, adc4_data)
        """
        samplemode = AcquisitionType.FINITE
        
        with ni.Task() as task_ai:
            # Configure analog input channels
            task_ai.ai_channels.add_ai_voltage_chan(self.channels.adc['all'])
            task_ai.timing.cfg_samp_clk_timing(
                rate=sample_rate, 
                sample_mode=samplemode
            )
            
            # Charge capacitor if requested
            if charge_first:
                self.charge_capacitor(capacitor)
            
            # Read data
            data = task_ai.read(number_of_samples_per_channel=samples_per_channel)
        
        return data[0], data[1], data[2], data[3]
    
    def read_with_charging(
        self,
        samples_per_channel: int = 500,
        sample_rate: int = 100,
        capacitor: str = 'cs1'
    ) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Complete acquisition cycle: charge capacitor and read data
        Automatically turns off relays after reading
        
        Args:
            samples_per_channel: Number of samples to read per channel
            sample_rate: Sampling rate in Hz
            capacitor: Capacitor to charge ('cs1', 'cs2', 'cs3', or 'cs4')
            
        Returns:
            Tuple of (adc1_data, adc2_data, adc3_data, adc4_data)
        """
        try:
            samplemode = AcquisitionType.FINITE
            
            with ni.Task() as task_ai:
                # Configure channels
                task_ai.ai_channels.add_ai_voltage_chan(self.channels.adc['all'])
                task_ai.timing.cfg_samp_clk_timing(
                    rate=sample_rate,
                    sample_mode=samplemode
                )
                
                # Charge and read
                self.charge_capacitor(capacitor)
                data = task_ai.read(number_of_samples_per_channel=samples_per_channel)
            
            return data[0], data[1], data[2], data[3]
            
        finally:
            # Always turn off relays
            self.relay_service.zk1_8(False)
            self.relay_service.zs1_1(False)
    
    def read_continuous_sample(
        self,
        samples_per_channel: int = 10,
        sample_rate: int = 100
    ) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Read a small continuous sample (for streaming)
        
        Args:
            samples_per_channel: Number of samples to read
            sample_rate: Sampling rate in Hz
            
        Returns:
            Tuple of (adc1_data, adc2_data, adc3_data, adc4_data)
        """
        samplemode = AcquisitionType.FINITE
        
        with ni.Task() as task_ai:
            task_ai.ai_channels.add_ai_voltage_chan(self.channels.adc['all'])
            task_ai.timing.cfg_samp_clk_timing(
                rate=sample_rate,
                sample_mode=samplemode
            )
            
            data = task_ai.read(number_of_samples_per_channel=samples_per_channel)
        
        return data[0], data[1], data[2], data[3]
    
    def read_adc_only(
        self,
        samples_per_channel: int = 500,
        sample_rate: int = 100
    ) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Read ADC data without any relay control or capacitor charging
        
        This method only performs data acquisition from the 4 ADC channels
        without modifying any relay states. Use this when relays are already
        configured externally.
        
        Args:
            samples_per_channel: Number of samples to read per channel
            sample_rate: Sampling rate in Hz
            
        Returns:
            Tuple of (adc1_data, adc2_data, adc3_data, adc4_data)
        """
        samplemode = AcquisitionType.FINITE
        
        with ni.Task() as task_ai:
            # Configure analog input channels
            task_ai.ai_channels.add_ai_voltage_chan(self.channels.adc['all'])
            task_ai.timing.cfg_samp_clk_timing(
                rate=sample_rate,
                sample_mode=samplemode
            )
            
            # Read data without any relay control
            data = task_ai.read(number_of_samples_per_channel=samples_per_channel)
        
        return data[0], data[1], data[2], data[3]


acquisition_service = AcquisitionService()

