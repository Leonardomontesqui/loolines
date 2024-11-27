import math
import asyncio
from bleak import BleakScanner
from datetime import datetime
from mac_vendor_lookup import MacLookup
import nest_asyncio

""" 
NEED TO INSTALL REQUIREMENTS BEFORE RUNNING
pip install -r requirements.txt
"""

RSSI_AT_ONE = 50  # RSSI OF MAC
PATH_LOSS_EXP = 2  # CONS2T
DISTANCE_LIMIT = 5  # Proximity
DISTANCE_TOLERANCE = 0.2 # Tolerance for grouping as one person
TIMEOUT_SECONDS = 10 # Model refreshes per second

nest_asyncio.apply()

# Preload MAC vendor data
mac_lookup = MacLookup()
try:
    mac_lookup.load_vendors()
except Exception as e:
    print(f"Failed to preload vendor database: {e}")

# HashMap to store RSSI history
rssi_history = {}

def calculate_distance(rssi, rssi_at_1m=-RSSI_AT_ONE, path_loss_exponent=PATH_LOSS_EXP):
    """Calculates distance based on RSSI."""
    try:
        return 10 ** ((rssi_at_1m - rssi) / (10 * path_loss_exponent))
    except Exception as e:
        print(f"Error calculating distance: {e}")
        return None

def update_rssi_history(address, rssi):
    """Updates the RSSI history for a given device and computes the average RSSI."""
    if address not in rssi_history:
        rssi_history[address] = []
    rssi_history[address].append(rssi)
    avg_rssi = sum(rssi_history[address]) / len(rssi_history[address])
    return avg_rssi

def group_devices_by_proximity(distances):
    """Groups devices by proximity within a specified tolerance."""
    distances.sort()
    groups = []
    current_group = []

    for i, distance in enumerate(distances):
        if not current_group or abs(distance - current_group[-1]) <= DISTANCE_TOLERANCE:
            current_group.append(distance)
        else:
            groups.append(current_group)
            current_group = [distance]

    if current_group:
        groups.append(current_group)

    return len(groups)  # Return number of people (groups)

def print_rssi_history():
    """Prints the contents of the RSSI history hashmap."""
    print("\nRSSI History:")
    for address, rssi_values in rssi_history.items():
        print(f"Device: {address}, RSSI History: {rssi_values}")

async def count_devices():
    try:
        devices = await BleakScanner.discover(timeout=TIMEOUT_SECONDS)
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Total devices found: {len(devices)}")

        distances = []
        for device in devices:
            avg_rssi = update_rssi_history(device.address, device.rssi)
            distance = calculate_distance(avg_rssi)
            if distance is not None and distance < DISTANCE_LIMIT:
                distances.append(distance)

        print("\nDevices within range:")
        for i, distance in enumerate(distances):
            print(f"Device {i + 1}: Distance = {distance:.2f} meters")

        # Count people based on device grouping
        people_count = group_devices_by_proximity(distances)
        print(f"\nEstimated number of people: {people_count}")

        #print_rssi_history()

    except Exception as e:
        print(f"Error: {e}")

async def continuous_count():
    try:
        while True:
            await count_devices()
            await asyncio.sleep(2)
    except KeyboardInterrupt:
        print("\nStopped scanning")

if __name__ == "__main__":
    print("Starting Bluetooth device scanner...")
    print("Press Ctrl+C to stop")
    asyncio.run(continuous_count())
