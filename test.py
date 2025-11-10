"""
DEPRECATED: This file is kept for backward compatibility only.

Please use the new modular services instead:
    from app.services.device_service import device_service
    from app.services.relay_service import relay_service
    from app.services.acquisition_service import acquisition_service

Or use the legacy compatibility module:
    from app.legacy_compat import *

See README_REFACTORED.md for details on the new structure.
"""

import warnings
warnings.warn(
    "test.py is deprecated. Use 'from app.services import *' or 'from app.legacy_compat import *' instead. "
    "See README_REFACTORED.md for details.",
    DeprecationWarning,
    stacklevel=2
)

# For backward compatibility, import everything from legacy_compat
from app.legacy_compat import *

# Keep the original imports for code that directly imports from test.py
import nidaqmx as ni
from nidaqmx.constants import AcquisitionType
import time
import matplotlib.pyplot as plt

# Original variable definitions (deprecated, use app.core.config instead)
daq_base = 'cDAQ1'  # simulated
# daq_base = 'cDAQ9189-2119A5F' # real

# ADC channel paths (deprecated, use app.core.daq_config instead)
ad00 = daq_base + 'Mod1/ai0'
ad01 = daq_base + 'Mod1/ai1'
ad02 = daq_base + 'Mod1/ai2'
ad03 = daq_base + 'Mod1/ai3'

# Relay paths (deprecated, use app.core.daq_config instead)
zs1_1_l = daq_base + 'Mod2/port0/line0'
zs1_2_l = daq_base + 'Mod2/port0/line1'
zs1_3_l = daq_base + 'Mod2/port0/line2'
zs1_4_l = daq_base + 'Mod2/port0/line3'

zs2_1_l = daq_base + 'Mod3/port0/line0'
zs2_2_l = daq_base + 'Mod3/port0/line1'
zs2_3_l = daq_base + 'Mod3/port0/line2'
zs2_4_l = daq_base + 'Mod3/port0/line3'

zk1_1_l = daq_base + 'Mod4/port0/line0'
zk1_2_l = daq_base + 'Mod4/port0/line1'
zk1_3_l = daq_base + 'Mod4/port0/line2'
zk1_4_l = daq_base + 'Mod4/port0/line3'
zk1_5_l = daq_base + 'Mod4/port0/line4'
zk1_6_l = daq_base + 'Mod4/port0/line5'
zk1_7_l = daq_base + 'Mod4/port0/line6'
zk1_8_l = daq_base + 'Mod4/port0/line7'

zk2_1_l = daq_base + 'Mod5/port0/line0'
zk2_2_l = daq_base + 'Mod5/port0/line1'
zk2_3_l = daq_base + 'Mod5/port0/line2'
zk2_4_l = daq_base + 'Mod5/port0/line3'
zk2_5_l = daq_base + 'Mod5/port0/line4'
zk2_6_l = daq_base + 'Mod5/port0/line5'
zk2_7_l = daq_base + 'Mod5/port0/line6'
zk2_8_l = daq_base + 'Mod5/port0/line7'

zk3_1_l = daq_base + 'Mod6/port0/line0'
zk3_2_l = daq_base + 'Mod6/port0/line1'
zk3_3_l = daq_base + 'Mod6/port0/line2'
zk3_4_l = daq_base + 'Mod6/port0/line3'
zk3_5_l = daq_base + 'Mod6/port0/line4'
zk3_6_l = daq_base + 'Mod6/port0/line5'
zk3_7_l = daq_base + 'Mod6/port0/line6'
zk3_8_l = daq_base + 'Mod6/port0/line7'

zk4_1_l = daq_base + 'Mod7/port0/line0'
zk4_2_l = daq_base + 'Mod7/port0/line1'
zk4_3_l = daq_base + 'Mod7/port0/line2'
zk4_4_l = daq_base + 'Mod7/port0/line3'
zk4_5_l = daq_base + 'Mod7/port0/line4'
zk4_6_l = daq_base + 'Mod7/port0/line5'
zk4_7_l = daq_base + 'Mod7/port0/line6'
zk4_8_l = daq_base + 'Mod7/port0/line7'


# Legacy test functions (deprecated)
def zadanie1():
    """DEPRECATED: Legacy test function"""
    query_devices()

    task0 = ni.Task()
    task0.do_channels.add_do_chan('cDAQ9189-2119A5FMod2/port0/line0')
    task0.start()

    task1 = ni.Task()
    task1.do_channels.add_do_chan('cDAQ9189-2119A5FMod2/port0/line1')
    task1.start()

    task0.write(True)
    value = True
    task1.write(value)
    time.sleep(1)
    task0.write(False)
    value = False
    task1.write(value)
    value = True
    task1.write(value)
    time.sleep(1)
    value = False
    task1.write(value)
    task1.close()


def zadanie2():
    """DEPRECATED: Legacy test function with matplotlib plotting"""
    from app.services.acquisition_service import acquisition_service
    
    samplemode1 = ni.constants.AcquisitionType.FINITE
    
    with ni.Task() as task_ai:
        task_ai.ai_channels.add_ai_voltage_chan(daq_base + "Mod1/ai0:3")
        task_ai.timing.cfg_samp_clk_timing(rate=50000, sample_mode=samplemode1)
        
        acquisition_service.charge_capacitor_cs1()
        data = task_ai.read(number_of_samples_per_channel=5000)

    time.sleep(1.5)
    zk1_8_call(False)
    zs1_1_call(False)

    plt.subplot(411)
    plt.title('ADC1')
    plt.grid(True)
    plt.plot(data[0])
    plt.subplot(412)
    plt.title('ADC2')
    plt.grid(True)
    plt.plot(data[1])
    plt.subplot(413)
    plt.title('ADC3')
    plt.grid(True)
    plt.plot(data[2])
    plt.subplot(414)
    plt.title('ADC4')
    plt.grid(True)
    plt.plot(data[3])
    plt.show()


if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("⚠️  WARNING: test.py is DEPRECATED!")
    print("=" * 70)
    print("Please use the new modular structure instead:")
    print()
    print("From command line:")
    print("    python run.py")
    print()
    print("In Python code:")
    print("    from app.services.device_service import device_service")
    print("    from app.services.relay_service import relay_service")
    print("    from app.services.acquisition_service import acquisition_service")
    print()
    print("Or for backward compatibility:")
    print("    from app.legacy_compat import *")
    print()
    print("See README_REFACTORED.md for the new project structure.")
    print("=" * 70 + "\n")
    
    # Execute zadanie2 for backward compatibility
    zadanie2()
