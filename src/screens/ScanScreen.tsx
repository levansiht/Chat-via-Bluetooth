import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  Switch,
} from 'react-native';
import {Device} from 'react-native-ble-plx';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBluetoothService} from '../services/BluetoothProvider';
import {RootStackParamList} from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// We need to extend Device for type safety with mock devices
type ExtendedDevice = Device | any; // Using 'any' here to handle mock device properties

const ScanScreen = () => {
  const [devices, setDevices] = useState<ExtendedDevice[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();

  // Use our bluetooth context
  const {bluetoothService, useMockService, toggleMockService} =
    useBluetoothService();

  useEffect(() => {
    checkBluetoothStatus();
    return () => {
      // Clean up when component unmounts
      bluetoothService.stopScan();
    };
  }, [bluetoothService]);

  const checkBluetoothStatus = async () => {
    try {
      // Reset devices when switching services
      setDevices([]);

      // Request necessary permissions
      const permissionsGranted = await bluetoothService.requestPermissions();
      if (!permissionsGranted) {
        Alert.alert('Permission Error', 'Bluetooth permissions not granted');
        return;
      }

      // Check if Bluetooth is enabled
      const enabled = await bluetoothService.isBluetoothEnabled();
      setBluetoothEnabled(enabled);

      if (!enabled && !useMockService) {
        Alert.alert(
          'Bluetooth Disabled',
          'Please enable Bluetooth to use this feature',
        );
      }
    } catch (error) {
      console.error('Failed to check Bluetooth status:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  };

  const startScan = () => {
    // Clear previously found devices
    setDevices([]);
    setScanning(true);

    bluetoothService.startScan((device: ExtendedDevice) => {
      // Add the device if it doesn't already exist in the list
      setDevices(prevDevices => {
        const deviceExists = prevDevices.some(d => d.id === device.id);
        if (!deviceExists) {
          return [...prevDevices, device];
        }
        return prevDevices;
      });
    });

    // Stop scan after 10 seconds
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
      stopScan(); // Stop scanning before connecting

      Alert.alert('Connect', `Connect to ${device.name || 'Unknown Device'}?`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Connect',
          onPress: async () => {
            const connectedDevice = await bluetoothService.connectToDevice(
              device.id,
            );
            if (connectedDevice) {
              // Navigate to device screen with the connected device
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

  const renderDeviceItem = ({item}: {item: ExtendedDevice}) => {
    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => connectToDevice(item)}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>ID: {item.id}</Text>
          <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
        </View>
        <View style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BLE Devices</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Bluetooth:{' '}
            {bluetoothEnabled || useMockService ? 'Enabled' : 'Disabled'}
          </Text>
          {useMockService && (
            <Text style={[styles.statusText, styles.mockText]}>MOCK MODE</Text>
          )}
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <View style={styles.mockToggle}>
          <Text style={styles.mockToggleText}>Use Mock Devices</Text>
          <Switch
            value={useMockService}
            onValueChange={() => {
              // Stop scanning before switching services
              if (scanning) {
                stopScan();
              }
              toggleMockService();
              // Check status after switching
              setTimeout(checkBluetoothStatus, 100);
            }}
          />
        </View>

        <Button
          title={scanning ? 'Stop Scan' : 'Scan for Devices'}
          onPress={scanning ? stopScan : startScan}
          disabled={!bluetoothEnabled && !useMockService}
        />
      </View>

      {scanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={renderDeviceItem}
        ListEmptyComponent={
          <Text style={styles.emptyList}>
            {scanning
              ? 'Searching for devices...'
              : 'No devices found. Tap "Scan for Devices" to start scanning.'}
          </Text>
        }
      />
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
  mockText: {
    fontWeight: 'bold',
    backgroundColor: '#FFC107',
    color: '#000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  optionsContainer: {
    padding: 16,
  },
  mockToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mockToggleText: {
    fontSize: 16,
    color: '#333',
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
