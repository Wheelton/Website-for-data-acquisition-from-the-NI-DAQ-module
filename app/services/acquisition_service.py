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
    
    def charge_capacitor_cs1(self):
        """
        Execute capacitor Cs1 charging sequence
        
        Sequence:
        1. Discharge phase (short circuit through resistor)
        2. Charging phase (connect to power supply)
        
        Note: After data collection, remember to turn off main relay (zs1_1)
        """
        # -------------- Discharge phase --------------
        self.relay_service.zs1_1(False)  # Main power OFF
        self.relay_service.zs1_2(True)   # ADC1 short circuit
        self.relay_service.zk1_5(True)   # R_1_1 ON
        self.relay_service.zk1_8(False)  # R1s4 OFF
        self.relay_service.zk2_1(True)   # Cs_1 ON
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
    
    def read_adc_data(
        self, 
        samples_per_channel: int = 500, 
        sample_rate: int = 100,
        charge_first: bool = False
    ) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Read data from all 4 ADC channels
        
        Args:
            samples_per_channel: Number of samples to read per channel
            sample_rate: Sampling rate in Hz
            charge_first: If True, charge capacitor before reading
            
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
                self.charge_capacitor_cs1()
            
            # Read data
            data = task_ai.read(number_of_samples_per_channel=samples_per_channel)
        
        return data[0], data[1], data[2], data[3]
    
    def read_with_charging(
        self,
        samples_per_channel: int = 500,
        sample_rate: int = 100
    ) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Complete acquisition cycle: charge capacitor and read data
        Automatically turns off relays after reading
        
        Args:
            samples_per_channel: Number of samples to read per channel
            sample_rate: Sampling rate in Hz
            
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
                self.charge_capacitor_cs1()
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


acquisition_service = AcquisitionService()

