import {BleManager, Device, State, Characteristic} from 'react-native-ble-plx';
import {PermissionsAndroid, Platform} from 'react-native';
import {encode, decode} from 'base-64';

const UART_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const UART_RX_CHARACTERISTIC_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const UART_TX_CHARACTERISTIC_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

function safeEncode(str: string): string {
  try {
    return encode(str);
  } catch (error) {
    console.error('Error encoding string:', error);
    return '';
  }
}

function safeDecode(base64: string): string {
  try {
    return decode(base64);
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}

class BluetoothService {
  private manager: BleManager;
  private devices: Map<string, Device>;
  private messageListeners: Map<
    string,
    (deviceId: string, message: string) => void
  >;
  private deviceCharacteristics: Map<string, Characteristic>;

  constructor() {
    this.manager = new BleManager();
    this.devices = new Map();
    this.messageListeners = new Map();
    this.deviceCharacteristics = new Map();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth requires location permission',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const scanGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: 'Bluetooth Scan Permission',
            message: 'App needs Bluetooth Scan permission',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const connectGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: 'Bluetooth Connect Permission',
            message: 'App needs Bluetooth Connect permission',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return (
          scanGranted === PermissionsAndroid.RESULTS.GRANTED &&
          connectGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  startScan(onDeviceFound: (device: Device) => void): void {
    this.manager.startDeviceScan(
      null,
      {allowDuplicates: false},
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && device.name) {
          this.devices.set(device.id, device);
          onDeviceFound(device);
        }
      },
    );
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  async connectToDevice(deviceId: string): Promise<Device | null> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      return null;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      this.messageListeners.delete(deviceId);
      this.deviceCharacteristics.delete(deviceId);

      await this.manager.cancelDeviceConnection(deviceId);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  destroy(): void {
    this.stopScan();
    this.manager.destroy();
  }

  addMessageListener(
    deviceId: string,
    listener: (deviceId: string, message: string) => void,
  ): void {
    this.messageListeners.set(deviceId, listener);
  }

  removeMessageListener(deviceId: string): void {
    this.messageListeners.delete(deviceId);
  }

  async setupMessageMonitoring(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);

      if (!device) {
        console.error('Device not found');
        return false;
      }

      const services = await device.services();
      const uartService = services.find(
        service =>
          service.uuid.toLowerCase() === UART_SERVICE_UUID.toLowerCase(),
      );
      if (!uartService) {
        console.warn('UART service not found on device');
        return false;
      }
      const characteristics = await uartService.characteristics();
      const txCharacteristic = characteristics.find(
        char =>
          char.uuid.toLowerCase() === UART_TX_CHARACTERISTIC_UUID.toLowerCase(),
      );

      if (!txCharacteristic) {
        console.warn('TX characteristic not found');
        return false;
      }

      this.deviceCharacteristics.set(deviceId, txCharacteristic);

      device.monitorCharacteristicForService(
        uartService.uuid,
        txCharacteristic.uuid,
        (error, characteristic) => {
          if (error) {
            console.error('Monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            const message = safeDecode(characteristic.value);
            const listener = this.messageListeners.get(deviceId);

            if (listener && message) {
              listener(deviceId, message);
            }
          }
        },
      );

      return true;
    } catch (error) {
      console.error('Failed to setup message monitoring:', error);
      return false;
    }
  }

  async sendMessage(deviceId: string, message: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);

      if (!device) {
        console.error('Device not found');
        return false;
      }

      const services = await device.services();
      const uartService = services.find(
        service =>
          service.uuid.toLowerCase() === UART_SERVICE_UUID.toLowerCase(),
      );

      if (!uartService) {
        console.warn('UART service not found on device');
        return false;
      }

      const characteristics = await uartService.characteristics();
      const rxCharacteristic = characteristics.find(
        char =>
          char.uuid.toLowerCase() === UART_RX_CHARACTERISTIC_UUID.toLowerCase(),
      );

      if (!rxCharacteristic) {
        console.warn('RX characteristic not found');
        return false;
      }

      const base64Message = safeEncode(message);

      if (!base64Message) {
        return false;
      }

      await device.writeCharacteristicWithResponseForService(
        uartService.uuid,
        rxCharacteristic.uuid,
        base64Message,
      );

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }
}

export default new BluetoothService();
