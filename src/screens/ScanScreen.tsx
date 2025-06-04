import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBluetoothService} from '../services/BluetoothProvider';
import {RootStackParamList} from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ExtendedDevice {
  id: string;
  name?: string;
  rssi?: number;
}
const ScanScreen = () => {
  const [devices, setDevices] = useState<ExtendedDevice[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();

  const {bluetoothService} = useBluetoothService();

  // Create a function to ensure devices are plain objects
  const createPlainDevice = (device: any): ExtendedDevice => {
    return JSON.parse(
      JSON.stringify({
        id: String(device?.id || `device-${Date.now()}-${Math.random()}`),
        name: String(device?.name || 'Unknown Device'),
        rssi: Number(device?.rssi || -100),
      }),
    );
  };

  const checkBluetoothStatus = useCallback(async () => {
    try {
      setDevices([]);

      const permissionsGranted = await bluetoothService.requestPermissions();
      if (!permissionsGranted) {
        Alert.alert('Permission Error', 'Bluetooth permissions not granted');
        return;
      }

      const enabled = await bluetoothService.isBluetoothEnabled();
      setBluetoothEnabled(enabled);

      if (!enabled) {
        Alert.alert(
          'Bluetooth Disabled',
          'Please enable Bluetooth to use this feature',
        );
      }
    } catch (error) {
      console.error('Failed to check Bluetooth status:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  }, [bluetoothService]);

  useEffect(() => {
    checkBluetoothStatus();
    return () => {
      bluetoothService.stopScan();
    };
  }, [bluetoothService, checkBluetoothStatus]);

  const startScan = () => {
    setDevices([]);
    setScanning(true);

    bluetoothService.startScan((device: any) => {
      setDevices(prevDevices => {
        // Create a completely plain object using JSON serialization
        const normalizedDevice = createPlainDevice(device);

        const deviceExists = prevDevices.some(
          d => d.id === normalizedDevice.id,
        );
        if (!deviceExists) {
          return [...prevDevices, normalizedDevice];
        }
        return prevDevices;
      });
    });

    setTimeout(() => {
      if (scanning) {
        stopScan();
      }
    }, 10000);
  };

  const stopScan = () => {
    bluetoothService.stopScan();
    setScanning(false);
  };

  const connectToDevice = async (device: ExtendedDevice) => {
    try {
      stopScan();

      Alert.alert('Connect', `Connect to ${device.name || 'Unknown Device'}?`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Connect',
          onPress: async () => {
            const connectedDevice = await bluetoothService.connectToDevice(
              device.id,
            );
            if (connectedDevice) {
              navigation.navigate('DeviceScreen', {
                deviceId: device.id,
                deviceName: device.name || 'Unknown Device',
              });
            } else {
              Alert.alert('Connection Failed', 'Failed to connect to device');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to device');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BLE Devices</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Bluetooth: {bluetoothEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <Button
          title={scanning ? 'Stop Scan' : 'Scan for Devices'}
          onPress={scanning ? stopScan : startScan}
          disabled={!bluetoothEnabled}
        />
      </View>

      {scanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      )}

      <ScrollView style={styles.container}>
        {devices.length === 0 ? (
          <Text style={styles.emptyList}>
            {scanning
              ? 'Searching for devices...'
              : 'No devices found. Tap "Scan for Devices" to start scanning.'}
          </Text>
        ) : (
          devices.map((item, index) => (
            <TouchableOpacity
              key={`device-${index}`}
              style={styles.deviceItem}
              onPress={() => connectToDevice(item)}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>
                  {item.name || 'Unknown Device'}
                </Text>
                <Text style={styles.deviceId}>ID: {item.id}</Text>
                <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
              </View>
              <View style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#4285F4',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusContainer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
  },
  optionsContainer: {
    padding: 16,
  },
  scanButtonContainer: {
    margin: 16,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  scanningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  deviceItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default ScanScreen;
