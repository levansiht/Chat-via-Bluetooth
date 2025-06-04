import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <Text style={styles.title}>🔍 Bluetooth Discovery</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {bluetoothEnabled ? '✅ Bluetooth Ready' : '❌ Bluetooth Disabled'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          onPress={scanning ? stopScan : startScan}
          disabled={!bluetoothEnabled}>
          <LinearGradient
            colors={
              scanning
                ? ['#e53e3e', '#c53030']
                : bluetoothEnabled
                ? ['#667eea', '#764ba2']
                : ['#a0aec0', '#718096']
            }
            style={[styles.scanButton]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.scanButtonText}>
              {scanning ? '⏹️ Stop Scanning' : '🔍 Start Scanning'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
              ? '🔍 Searching for nearby devices...\nMake sure your target device is discoverable!'
              : '📱 No devices found yet.\n\nTap "Start Scanning" to discover Bluetooth devices in your area.'}
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
    backgroundColor: '#f7fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#667eea',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    padding: 20,
  },
  scanButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  deviceItem: {
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 2,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#48bb78',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 60,
    color: '#718096',
    fontSize: 16,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
});

export default ScanScreen;
