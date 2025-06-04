import {useBluetoothService} from './BluetoothProvider';
import DatabaseService from '../database/DatabaseService';
import {Device} from 'react-native-ble-plx';

class ChatService {
  private bluetoothService:
    | ReturnType<typeof useBluetoothService>['bluetoothService']
    | null = null;
  private activeListeners: Map<string, boolean> = new Map();

  setBluetoothService(
    service: ReturnType<typeof useBluetoothService>['bluetoothService'],
  ) {
    this.bluetoothService = service;
  }

  async connectAndSetupChat(device: Device): Promise<boolean> {
    if (!this.bluetoothService) {
      console.error('Bluetooth service not set');
      return false;
    }

    try {
      const connectedDevice = await this.bluetoothService.connectToDevice(
        device.id,
      );

      if (!connectedDevice) {
        console.error('Failed to connect to device');
        return false;
      }

      await DatabaseService.saveDevice(device.id, device.name, device.rssi);

      const monitoringSuccess =
        await this.bluetoothService.setupMessageMonitoring(device.id);

      if (!monitoringSuccess) {
        console.warn(
          'Could not setup message monitoring, but connection successful',
        );
      } else {
        this.setupMessageListener(device.id);
      }

      return true;
    } catch (error) {
      console.error('Error in connectAndSetupChat:', error);
      return false;
    }
  }

  private setupMessageListener(deviceId: string) {
    if (!this.bluetoothService) {
      return;
    }

    if (this.activeListeners.get(deviceId)) {
      return;
    }

    this.activeListeners.set(deviceId, true);

    this.bluetoothService.addMessageListener(
      deviceId,
      async (receivedDeviceId: string, message: string) => {
        await DatabaseService.saveMessage(receivedDeviceId, message, false);
      },
    );
  }

  async sendMessage(deviceId: string, message: string): Promise<boolean> {
    if (!this.bluetoothService) {
      console.error('Bluetooth service not set');
      return false;
    }

    try {
      await DatabaseService.saveMessage(deviceId, message, true);

      const success = await this.bluetoothService.sendMessage(
        deviceId,
        message,
      );

      if (!success) {
        console.warn('Failed to send message via Bluetooth');
      }

      return success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    if (!this.bluetoothService) {
      return;
    }

    try {
      this.activeListeners.delete(deviceId);
      this.bluetoothService.removeMessageListener(deviceId);

      await this.bluetoothService.disconnectDevice(deviceId);
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  }

  async loadChatHistory(deviceId: string) {
    return await DatabaseService.getMessages(deviceId);
  }

  async clearChatHistory(deviceId: string): Promise<void> {
    await DatabaseService.deleteAllMessages(deviceId);
  }
}

export default new ChatService();
