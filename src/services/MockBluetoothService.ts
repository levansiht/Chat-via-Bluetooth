import {
  Device,
  Characteristic,
  Service,
  ConnectionOptions,
} from 'react-native-ble-plx';
import {Platform} from 'react-native';

class MockDevice {
  id: string;
  name: string;
  rssi: number;
  _isConnected: boolean = false;

  constructor(id: string, name: string, rssi: number) {
    this.id = id;
    this.name = name;
    this.rssi = rssi;
  }

  isConnected(): Promise<boolean> {
    return Promise.resolve(this._isConnected);
  }

  async connect(options?: ConnectionOptions): Promise<Device> {
    this._isConnected = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this as unknown as Device;
  }

  async discoverAllServicesAndCharacteristics(
    transactionId?: string,
  ): Promise<Device> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return this as unknown as Device;
  }
}

class MockBluetoothService {
  private mockDevices: MockDevice[] = [];
  private scanCallback: ((device: Device) => void) | null = null;
  private isScanningActive: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private messageListeners: Map<
    string,
    (deviceId: string, message: string) => void
  > = new Map();

  private autoReplyMessages: string[] = [
    'Hello there!',
    'Nice to meet you',
    'How can I help you?',
    'I am a mock device',
    'Signal strength is good',
    'Battery level at 80%',
    'Command received',
    'Processing request',
    'Operation successful',
    'Standing by for instructions',
  ];
  constructor() {
    this.mockDevices = [
      new MockDevice('00:11:22:33:44:55', 'Mock iPhone', -65),
      new MockDevice('AA:BB:CC:DD:EE:FF', 'Mock Android', -72),
      new MockDevice('11:22:33:44:55:66', 'Mock Speaker', -58),
      new MockDevice('AA:11:BB:22:CC:33', 'Mock Headphones', -80),
      new MockDevice('FF:EE:DD:CC:BB:AA', 'Mock Smart Watch', -75),
    ];
  }

  async requestPermissions(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
    return true;
  }

  startScan(onDeviceFound: (device: Device) => void): void {
    this.isScanningActive = true;
    this.scanCallback = onDeviceFound;

    this.mockDevices.forEach((device, index) => {
      setTimeout(() => {
        if (this.isScanningActive && this.scanCallback) {
          this.scanCallback(device as unknown as Device);
        }
      }, 1000 + Math.random() * 3000 + index * 1000);
    });

    this.scanInterval = setInterval(() => {
      if (!this.isScanningActive) {
        if (this.scanInterval) {
          clearInterval(this.scanInterval);
          this.scanInterval = null;
        }
        return;
      }

      const shouldAddRandomDevice = Math.random() > 0.7;
      if (shouldAddRandomDevice && this.scanCallback) {
        const randomId = Math.random().toString(16).substring(2, 10);
        const newDevice = new MockDevice(
          `${randomId}:${randomId}`,
          `Random Device ${Math.floor(Math.random() * 100)}`,
          -55 - Math.floor(Math.random() * 40),
        );
        this.scanCallback(newDevice as unknown as Device);
      }
    }, 4000);
  }

  stopScan(): void {
    this.isScanningActive = false;
    this.scanCallback = null;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  async connectToDevice(deviceId: string): Promise<Device | null> {
    const device = this.mockDevices.find(d => d.id === deviceId);

    if (!device) {
      if (Math.random() > 0.9) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return null;
      }

      const newDevice = new MockDevice(
        deviceId,
        `Device ${deviceId.substring(0, 5)}`,
        -70,
      );

      await newDevice.connect();
      this.mockDevices.push(newDevice);
      return newDevice as unknown as Device;
    }

    await device.connect();
    return device as unknown as Device;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.mockDevices.find(d => d.id === deviceId);

    if (device) {
      device._isConnected = false;
    }

    this.messageListeners.delete(deviceId);

    await new Promise(resolve => setTimeout(resolve, 800));
  }

  getDevices(): Device[] {
    return this.mockDevices.filter(d => d._isConnected) as unknown as Device[];
  }

  destroy(): void {
    this.stopScan();
    this.messageListeners.clear();
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  async sendMessage(deviceId: string, message: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));

    setTimeout(() => {
      const listener = this.messageListeners.get(deviceId);
      if (listener) {
        const randomIndex = Math.floor(
          Math.random() * this.autoReplyMessages.length,
        );
        const reply = this.autoReplyMessages[randomIndex];
        listener(deviceId, reply);
      }
    }, 1000 + Math.random() * 2000);

    return true;
  }
}

export default new MockBluetoothService();
