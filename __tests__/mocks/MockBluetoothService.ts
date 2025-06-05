export class MockBluetoothService {
  private connectedDevices = new Set<string>();
  private messageCallbacks = new Map<string, Function>();

  async connectToDevice(deviceId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    this.connectedDevices.add(deviceId);
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connectedDevices.delete(deviceId);
    this.messageCallbacks.delete(deviceId);
    return true;
  }

  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  async setupMessageMonitoring(deviceId: string): Promise<void> {
    if (!this.isConnected(deviceId)) {
      throw new Error('Device not connected');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  async sendMessage(deviceId: string, message: string): Promise<boolean> {
    if (!this.isConnected(deviceId)) {
      throw new Error('Device not connected');
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate message echo for testing
    setTimeout(() => {
      const callback = this.messageCallbacks.get(deviceId);
      if (callback) {
        callback(`Echo: ${message}`);
      }
    }, 100);

    return true;
  }

  onMessageReceived(deviceId: string, callback: Function): void {
    this.messageCallbacks.set(deviceId, callback);
  }

  async scanForDevices(): Promise<Array<{id: string; name: string}>> {
    return [
      {id: 'mock-device-1', name: 'Mock BLE Device 1'},
      {id: 'mock-device-2', name: 'Mock BLE Device 2'},
    ];
  }
}
