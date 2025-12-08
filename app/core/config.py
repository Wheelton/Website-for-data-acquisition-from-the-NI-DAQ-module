"""
Application Configuration
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    app_name: str = "NI DAQ Web Service"
    app_version: str = "1.0.1"
    app_description: str = "Web service for data acquisition from NI DAQ module"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS Configuration
    cors_origins: List[str] = ["*"]
    
    # DAQ Configuration
    # Use 'cDAQ1' for simulation, 'cDAQ9189-2119A5F' for real device
    daq_device_name: str = 'cDAQ1'
    
    # Default acquisition settings
    default_sample_rate: int = 100
    default_samples: int = 500
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

