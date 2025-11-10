import nidaqmx as ni
from nidaqmx.constants import AcquisitionType
import time
import matplotlib.pyplot as plt

daq_base = 'cDAQ1'  # symulowane
# daq_base = 'cDAQ9189-2119A5F' #real 
# ------------sciezki ADC NI
ad00 = daq_base+'Mod1/ai0'
ad01 = daq_base+'Mod1/ai1'
ad02 = daq_base+'Mod1/ai2'
ad03 = daq_base+'Mod1/ai3'

# -----------sciezki przekaznikow w NI DAQ
zs1_1_l = daq_base+'Mod2/port0/line0'
zs1_2_l = daq_base+'Mod2/port0/line1'
zs1_3_l = daq_base+'Mod2/port0/line2'
zs1_4_l = daq_base+'Mod2/port0/line3'

zs2_1_l = daq_base+'Mod3/port0/line0'
zs2_2_l = daq_base+'Mod3/port0/line1'
zs2_3_l = daq_base+'Mod3/port0/line2'
zs2_4_l = daq_base+'Mod3/port0/line3'

zk1_1_l = daq_base+'Mod4/port0/line0'
zk1_2_l = daq_base+'Mod4/port0/line1'
zk1_3_l = daq_base+'Mod4/port0/line2'
zk1_4_l = daq_base+'Mod4/port0/line3'
zk1_5_l = daq_base+'Mod4/port0/line4'
zk1_6_l = daq_base+'Mod4/port0/line5'
zk1_7_l = daq_base+'Mod4/port0/line6'
zk1_8_l = daq_base+'Mod4/port0/line7'

zk2_1_l = daq_base+'Mod5/port0/line0'
zk2_2_l = daq_base+'Mod5/port0/line1'
zk2_3_l = daq_base+'Mod5/port0/line2'
zk2_4_l = daq_base+'Mod5/port0/line3'
zk2_5_l = daq_base+'Mod5/port0/line4'
zk2_6_l = daq_base+'Mod5/port0/line5'
zk2_7_l = daq_base+'Mod5/port0/line6'
zk2_8_l = daq_base+'Mod5/port0/line7'

zk3_1_l = daq_base+'Mod6/port0/line0'
zk3_2_l = daq_base+'Mod6/port0/line1'
zk3_3_l = daq_base+'Mod6/port0/line2'
zk3_4_l = daq_base+'Mod6/port0/line3'
zk3_5_l = daq_base+'Mod6/port0/line4'
zk3_6_l = daq_base+'Mod6/port0/line5'
zk3_7_l = daq_base+'Mod6/port0/line6'
zk3_8_l = daq_base+'Mod6/port0/line7'

zk4_1_l = daq_base+'Mod7/port0/line0'
zk4_2_l = daq_base+'Mod7/port0/line1'
zk4_3_l = daq_base+'Mod7/port0/line2'
zk4_4_l = daq_base+'Mod7/port0/line3'
zk4_5_l = daq_base+'Mod7/port0/line4'
zk4_6_l = daq_base+'Mod7/port0/line5'
zk4_7_l = daq_base+'Mod7/port0/line6'
zk4_8_l = daq_base+'Mod7/port0/line7'


def query_devices():
    local_system = ni.system.System.local()
    driver_version = local_system.driver_version

    print('DAQmx {0}.{1}.{2}'.format(driver_version.major_version, driver_version.minor_version, driver_version.update_version))

    for device in local_system.devices:
        print('Device Name: {0}, Product Category: {1}, Product Type: {2}'.format(device.name, device.product_category, device.product_type))

def zadanie1():
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



#-------------------przekazniki
def zs1_1_call(on):
    info = 'zs1_1 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zs1_1_l)
        task.write(on)
    return info

def zs1_2_call(on):
    info = 'zs1_2 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zs1_2_l)
        task.write(on)
    return info


def zs2_1_call(on):
    info = 'zs2_1 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zs2_1_l)
        task.write(on)
    return info


def zs2_2_call(on):
    info = 'zs2_2 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zs2_2_l)
        task.write(on)
    return info

#rezystor R1s1
def zk1_5_call(on):
    info = 'zk1_5 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zk1_5_l)
        task.write(on)
    return info

#rezystor R1s4
def zk1_8_call(on):
    info = 'zk1_8 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zk1_8_l)
        task.write(on)
    return info

def zk2_1_call(on):
    info = 'zk2_1 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zk2_1_l)
        task.write(on)
    return info


def zk2_5_call(on):
    info = 'zk2_5 ' + str(on)
    print(info)
    with ni.Task() as task:
        task.do_channels.add_do_chan(zk2_5_l)
        task.write(on)
    return info

def laduj_Cs1():

    #--------------rozladowanie
    zs1_1_call(False)  #wyl glowny
    zs1_2_call(True) #ADC1 zwarcie
    zk1_5_call(True) #R_1_1 zalacz
    zk1_8_call(False) #wyl przy rezystorze R1s4
    zk2_1_call(True) #Cs_1 zalacz
    zs2_1_call(True) #GND zalacz
    zs2_2_call(True) #zwarcie obwodu do rozladowania
    zk2_5_call(True) #zwarcie przez rezystor R2s_1
    time.sleep(0.5)
    zs2_2_call(False) #zwarcie obwodu do rozladowania
    zk2_5_call(False) #zwarcie przez rezystor R2s_1
    #--------------ladowanie
    zk1_5_call(False) #R_1_1 zalacz    
     
    zk1_8_call(True)#zal przy rezystorze R1s4
    zs1_1_call(True) #wyl glowny

    #UWAGA: po zebraniu danych wyl glowny |OFF| zs1_1_call(False)


def zadanie2():

    samplemode1 = ni.constants.AcquisitionType.FINITE#tryb jednokrotny
    samplemode2 = ni.constants.AcquisitionType.CONTINUOUS# tryb ciagly
   
    # laduj_Cs1()#ladowanie kondensatora
    with ni.Task() as task_ai:

       
        task_ai.ai_channels.add_ai_voltage_chan(daq_base + "Mod1/ai0:3")
        task_ai.timing.cfg_samp_clk_timing(rate=100,sample_mode=samplemode1)
        #task_ai.triggers.reference_trigger.cfg_anlg_edge_ref_trig(daq_base + "Mod1/ai3", pretrigger_samples = 10, trigger_slope=ni.constants.Slope.RISING, trigger_level = 1)
        laduj_Cs1()#ladowanie kondensatora
        data = task_ai.read(number_of_samples_per_channel=500) #rozpoczecie pomiaru              

    # time.sleep(1.5)
    zk1_8_call(False) #wyl przy rezystorze R1s4
    zs1_1_call(False) #wyl glowny



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
    # Execute...
    zadanie2()



##"""Example for writing digital signal."""
##import nidaqmx
##from nidaqmx.constants import LineGrouping
##import time
##
##
##with nidaqmx.Task() as task:
##    task.do_channels.add_do_chan(
##        "Mod4/port0/line0:3", line_grouping=LineGrouping.CHAN_FOR_ALL_LINES
##    )
##
##    try:
##        print("N Lines 1 Sample Boolean Write (Error Expected): ")
##        print(task.write([True, False, True, False]))
##    except nidaqmx.DaqError as e:
##        print(e)
##
##    print("1 Channel N Lines 1 Sample Unsigned Integer Write: ")
##    print(task.write(8))
##    time.sleep(2)
##    print(20*'-')
##    print(task.read())
##
##    print("1 Channel N Lines N Samples Unsigned Integer Write: ")
##    print(task.write([1, 2, 4, 8], auto_start=True))
##
