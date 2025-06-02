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
      // Connect to the device
      const connectedDevice = await this.bluetoothService.connectToDevice(
        device.id,
      );

      if (!connectedDevice) {
        console.error('Failed to connect to device');
        return false;
      }

      // Save device to database
      await DatabaseService.saveDevice(device.id, device.name, device.rssi);

      // Setup message monitoring
      const monitoringSuccess =
        await this.bluetoothService.setupMessageMonitoring(device.id);

      if (!monitoringSuccess) {
        console.warn(
          'Could not setup message monitoring, but connection successful',
        );
      } else {
        // Add message listener
        this.setupMessageListener(device.id);
      }

      return true;
    } catch (error) {
      console.error('Error in connectAndSetupChat:', error);
      return false;
    }
  }

  private setupMessageListener(deviceId: string) {
    if (!this.bluetoothService) return;

    // Prevent duplicate listeners
    if (this.activeListeners.get(deviceId)) {
      return;
    }

    this.activeListeners.set(deviceId, true);

    // Add message listener to Bluetooth service
    this.bluetoothService.addMessageListener(
      deviceId,
      async (deviceId, message) => {
        // When a message is received, save it to the database
        await DatabaseService.saveMessage(deviceId, message, false);
      },
    );
  }

  async sendMessage(deviceId: string, message: string): Promise<boolean> {
    if (!this.bluetoothService) {
      console.error('Bluetooth service not set');
      return false;
    }

    try {
      // First save the message to the database
      await DatabaseService.saveMessage(deviceId, message, true);

      // Then try to send it via Bluetooth
      const success = await this.bluetoothService.sendMessage(
        deviceId,
        message,
      );

      // If sending failed, we could update the message status in the database
      if (!success) {
        console.warn('Failed to send message via Bluetooth');
        // We could implement status updates here
      }

      return success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    if (!this.bluetoothService) return;

    try {
      // Remove active listener
      this.activeListeners.delete(deviceId);
      this.bluetoothService.removeMessageListener(deviceId);

      // Disconnect device
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
