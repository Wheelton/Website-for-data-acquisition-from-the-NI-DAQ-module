"""
Device Information Service
Handles querying DAQ devices and system information
"""
import nidaqmx as ni
from app.models.schemas import DeviceInfo, DevicesResponse


class DeviceService:
    """Service for querying DAQ device information"""
    
    @staticmethod
    def get_devices() -> DevicesResponse:
        """
        Query connected DAQ devices
        
        Returns:
            DevicesResponse with driver version and device list
        """
        local_system = ni.system.System.local()
        driver_version = local_system.driver_version
        
        devices = []
        for device in local_system.devices:
            devices.append(DeviceInfo(
                name=device.name,
                product_category=str(device.product_category),
                product_type=device.product_type
            ))
        
        version_string = f"{driver_version.major_version}.{driver_version.minor_version}.{driver_version.update_version}"
        
        return DevicesResponse(
            driver_version=version_string,
            devices=devices
        )
    
    @staticmethod
    def print_device_info():
        """Print device information to console (for debugging)"""
        local_system = ni.system.System.local()
        driver_version = local_system.driver_version
        
        print(f'DAQmx {driver_version.major_version}.{driver_version.minor_version}.{driver_version.update_version}')
        
        for device in local_system.devices:
            print(f'Device Name: {device.name}, Product Category: {device.product_category}, Product Type: {device.product_type}')


device_service = DeviceService()

