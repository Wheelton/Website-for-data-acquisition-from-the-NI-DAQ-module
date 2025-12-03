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
        
        # Active acquisition task state
        self._active_task = None
        self._task_config = None
    
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
    
    def start_read_adc(
        self,
        samples_per_channel: int = 500,
        sample_rate: int = 100
    ) -> dict:
        """
        Start continuous ADC measurement from all 4 ADC channels
        
        This method configures and starts continuous data acquisition without
        returning any data. Data collection happens in the background until
        stop_read_adc() is called.
        
        Args:
            samples_per_channel: Number of samples per channel to acquire
            sample_rate: Sampling rate in Hz
            
        Returns:
            Dictionary with status and configuration info
            
        Raises:
            RuntimeError: If acquisition is already running
        """
        if self._active_task is not None:
            raise RuntimeError("ADC acquisition is already running. Stop it first with stop_read_adc()")
        
        # Create and configure the task
        self._active_task = ni.Task()
        
        # Configure analog input channels
        self._active_task.ai_channels.add_ai_voltage_chan(self.channels.adc['all'])
        
        # Configure timing for CONTINUOUS acquisition
        # This allows stopping at any time and reading whatever data is available
        self._active_task.timing.cfg_samp_clk_timing(
            rate=sample_rate,
            sample_mode=AcquisitionType.CONTINUOUS,
            samps_per_chan=samples_per_channel  # Buffer size
        )
        
        # Start the task (begins acquisition)
        self._active_task.start()
        
        # Store configuration for later reference
        self._task_config = {
            'samples_per_channel': samples_per_channel,
            'sample_rate': sample_rate,
            'channels': 4
        }
        
        return {
            'status': 'started',
            'samples_per_channel': samples_per_channel,
            'sample_rate': sample_rate,
            'channels': 4
        }
    
    def stop_read_adc(self) -> Tuple[List[float], List[float], List[float], List[float]]:
        """
        Stop ADC acquisition and return all collected data
        
        This method stops the running acquisition task and returns all
        data collected from the 4 ADC channels since start_read_adc() was called.
        
        Returns:
            Tuple of (adc1_data, adc2_data, adc3_data, adc4_data)
            
        Raises:
            RuntimeError: If no acquisition is currently running
        """
        if self._active_task is None:
            raise RuntimeError("No ADC acquisition is running. Start it first with start_read_adc()")
        
        task_to_cleanup = self._active_task
        config_to_return = self._task_config
        
        try:
            # Read all available samples (-1 means read all available)
            # This works with CONTINUOUS mode and returns whatever is in the buffer
            data = task_to_cleanup.read(
                number_of_samples_per_channel=-1
            )
            
            # Validate data format
            if data is None or len(data) < 4:
                raise ValueError(f"Invalid data received from DAQ: expected 4 channels, got {len(data) if data else 0}")
            
            # Extract data for each channel
            adc1_data = data[0] if isinstance(data[0], list) else [data[0]]
            adc2_data = data[1] if isinstance(data[1], list) else [data[1]]
            adc3_data = data[2] if isinstance(data[2], list) else [data[2]]
            adc4_data = data[3] if isinstance(data[3], list) else [data[3]]
            
            print(f"ADC acquisition stopped. Collected {len(adc1_data)} samples per channel.")
            
            return adc1_data, adc2_data, adc3_data, adc4_data
            
        except Exception as e:
            print(f"Error reading ADC data: {str(e)}")
            raise
            
        finally:
            # Always clean up the task, even if read fails
            try:
                if task_to_cleanup is not None:
                    task_to_cleanup.stop()
                    task_to_cleanup.close()
            except Exception as cleanup_error:
                print(f"Error during task cleanup: {str(cleanup_error)}")
            
            # Clear state
            self._active_task = None
            self._task_config = None
    
    def is_acquisition_running(self) -> bool:
        """
        Check if ADC acquisition is currently running
        
        Returns:
            True if acquisition is running, False otherwise
        """
        return self._active_task is not None


acquisition_service = AcquisitionService()

