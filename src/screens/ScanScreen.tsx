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
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  GRADIENTS,
} from '../constants';

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
  const [bluetoothChecking, setBluetoothChecking] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  const {bluetoothService} = useBluetoothService();

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
      setBluetoothChecking(true);

      const permissionsGranted = await bluetoothService.requestPermissions();
      if (!permissionsGranted) {
        Alert.alert('Permission Error', 'Bluetooth permissions not granted');
        setBluetoothChecking(false);
        return;
      }

      const enabled = await bluetoothService.isBluetoothEnabled();
      setBluetoothEnabled(enabled);
      setBluetoothChecking(false);

      if (!enabled) {
        Alert.alert(
          'Bluetooth Disabled',
          'Please enable Bluetooth to use this feature',
        );
      }
    } catch (error) {
      console.error('Failed to check Bluetooth status:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth');
      setBluetoothChecking(false);
    }
  }, [bluetoothService]);
  const stopScan = useCallback(() => {
    bluetoothService.stopScan();
    setScanning(false);
  }, [bluetoothService]);

  useEffect(() => {
    checkBluetoothStatus();

    const handleBluetoothStateChange = (isEnabled: boolean) => {
      setBluetoothEnabled(isEnabled);
      if (!isEnabled && scanning) {
        stopScan();
        Alert.alert(
          'Bluetooth Disabled',
          'Bluetooth was turned off. Scanning stopped.',
        );
      }
    };

    bluetoothService.addBluetoothStateListener(handleBluetoothStateChange);

    return () => {
      bluetoothService.stopScan();
      bluetoothService.removeBluetoothStateListener(handleBluetoothStateChange);
    };
  }, [bluetoothService, checkBluetoothStatus, scanning, stopScan]);

  const startScan = async () => {
    try {
      setDevices([]);

      await bluetoothService.startScanWithValidation((device: any) => {
        setDevices(prevDevices => {
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

      setScanning(true);

      setTimeout(() => {
        if (scanning) {
          stopScan();
        }
      }, 10000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Bluetooth is not enabled')) {
          Alert.alert(
            'Bluetooth Disabled',
            'Please enable Bluetooth first before scanning for devices.',
            [
              {text: 'OK', style: 'default'},
              {
                text: 'Check Again',
                onPress: checkBluetoothStatus,
                style: 'default',
              },
            ],
          );
        } else if (error.message.includes('permissions not granted')) {
          Alert.alert(
            'Permission Required',
            'Bluetooth permissions are required to scan for devices.',
            [
              {text: 'OK', style: 'default'},
              {
                text: 'Try Again',
                onPress: checkBluetoothStatus,
                style: 'default',
              },
            ],
          );
        } else {
          Alert.alert('Error', `Failed to start scanning: ${error.message}`);
        }
      }
    }
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
        colors={GRADIENTS.primary}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <Text style={styles.title}>🔍 Bluetooth Discovery</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {bluetoothChecking
              ? '🔄 Checking Bluetooth...'
              : bluetoothEnabled
              ? '✅ Bluetooth Ready'
              : '❌ Bluetooth Not Ready'}
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
                ? GRADIENTS.error
                : bluetoothEnabled
                ? GRADIENTS.primary
                : GRADIENTS.disabled
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
          <ActivityIndicator size="small" color={COLORS.blue} />
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
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xxl,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.whiteTransparent,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.normal,
  },
  optionsContainer: {
    padding: SPACING.xxl,
  },
  scanButton: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOffset: SHADOWS.medium.shadowOffset,
    shadowOpacity: SHADOWS.medium.shadowOpacity,
    shadowRadius: SHADOWS.medium.shadowRadius,
    elevation: SHADOWS.medium.elevation,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryWithOpacity,
    marginHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  scanningText: {
    marginLeft: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.normal,
  },
  deviceItem: {
    flexDirection: 'row',
    padding: SPACING.xxl,
    marginHorizontal: SPACING.xl,
    marginVertical: 6,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: SHADOWS.light.shadowOffset,
    shadowOpacity: SHADOWS.light.shadowOpacity,
    shadowRadius: SHADOWS.light.shadowRadius,
    elevation: SHADOWS.light.elevation,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  deviceId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  deviceRssi: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.tertiary,
    fontWeight: FONT_WEIGHTS.normal,
  },
  connectButton: {
    backgroundColor: COLORS.status.success,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
    shadowColor: COLORS.status.success,
    shadowOffset: SHADOWS.colored.shadowOffset,
    shadowOpacity: SHADOWS.colored.shadowOpacity,
    shadowRadius: SHADOWS.colored.shadowRadius,
    elevation: SHADOWS.colored.elevation,
  },
  connectButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: SPACING.massive,
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.md,
    paddingHorizontal: SPACING.huge,
    lineHeight: SPACING.xxxl,
  },
});

export default ScanScreen;
