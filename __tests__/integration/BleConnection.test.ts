// import {BluetoothService} from '../../src/services/BluetoothService';
import ChatService from '../../src/services/ChatService';
import {MockBluetoothService} from '../mocks/MockBluetoothService';

describe('BLE Connection Integration Tests', () => {
  let bluetoothService: MockBluetoothService;

  beforeEach(() => {
    bluetoothService = new MockBluetoothService();
    ChatService.setBluetoothService(bluetoothService as any);
  });

  describe('Device Connection Flow', () => {
    it('should successfully connect to a device', async () => {
      const mockDevice = {
        id: 'test-device-123',
        name: 'Test BLE Device',
      };

      const result = await bluetoothService.connectToDevice(mockDevice.id);

      expect(result).toBe(true);
      expect(bluetoothService.isConnected(mockDevice.id)).toBe(true);
    });

    it('should handle connection failure', async () => {
      const mockDevice = {
        id: 'test-device-123',
        name: 'Test BLE Device',
      };

      // Mock connection failure
      jest
        .spyOn(bluetoothService, 'connectToDevice')
        .mockRejectedValue(new Error('Connection failed'));

      await expect(
        bluetoothService.connectToDevice(mockDevice.id),
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('Chat Functionality', () => {
    const deviceId = 'test-device-123';

    beforeEach(async () => {
      // Setup connection
      await bluetoothService.connectToDevice(deviceId);
    });

    it('should setup message monitoring successfully', async () => {
      await expect(
        bluetoothService.setupMessageMonitoring(deviceId),
      ).resolves.toBeUndefined();
    });

    it('should send message successfully', async () => {
      const testMessage = 'Hello from test!';

      const result = await bluetoothService.sendMessage(deviceId, testMessage);

      expect(result).toBe(true);
    });

    it('should receive messages', async () => {
      const testMessage = 'Hello from remote device!';
      const mockCallback = jest.fn();

      bluetoothService.onMessageReceived(deviceId, mockCallback);

      // Simulate message reception by calling the callback
      const callback = (bluetoothService as any).messageCallbacks.get(deviceId);
      if (callback) {
        callback(testMessage);
      }

      expect(mockCallback).toHaveBeenCalledWith(testMessage);
    });

    it('should handle message send failure for disconnected device', async () => {
      const testMessage = 'Hello from test!';

      // Disconnect first
      await bluetoothService.disconnectDevice(deviceId);

      await expect(
        bluetoothService.sendMessage(deviceId, testMessage),
      ).rejects.toThrow('Device not connected');
    });

    it('should handle setup monitoring failure for disconnected device', async () => {
      // Disconnect first
      await bluetoothService.disconnectDevice(deviceId);

      await expect(
        bluetoothService.setupMessageMonitoring(deviceId),
      ).rejects.toThrow('Device not connected');
    });
  });

  describe('Device Scanning', () => {
    it('should return mock devices when scanning', async () => {
      const devices = await bluetoothService.scanForDevices();

      expect(devices).toHaveLength(2);
      expect(devices[0]).toEqual({
        id: 'mock-device-1',
        name: 'Mock BLE Device 1',
      });
      expect(devices[1]).toEqual({
        id: 'mock-device-2',
        name: 'Mock BLE Device 2',
      });
    });
  });

  describe('Disconnection', () => {
    const deviceId = 'test-device-123';

    beforeEach(async () => {
      await bluetoothService.connectToDevice(deviceId);
    });

    it('should disconnect device successfully', async () => {
      const result = await bluetoothService.disconnectDevice(deviceId);

      expect(result).toBe(true);
      expect(bluetoothService.isConnected(deviceId)).toBe(false);
    });

    it('should clear message callbacks on disconnect', async () => {
      const mockCallback = jest.fn();
      bluetoothService.onMessageReceived(deviceId, mockCallback);

      await bluetoothService.disconnectDevice(deviceId);

      // Should not have any callbacks after disconnect
      const callbacks = (bluetoothService as any).messageCallbacks;
      expect(callbacks.has(deviceId)).toBe(false);
    });
  });

  describe('Multiple Device Management', () => {
    it('should handle multiple connected devices', async () => {
      const device1 = 'device-1';
      const device2 = 'device-2';

      await bluetoothService.connectToDevice(device1);
      await bluetoothService.connectToDevice(device2);

      expect(bluetoothService.isConnected(device1)).toBe(true);
      expect(bluetoothService.isConnected(device2)).toBe(true);

      await bluetoothService.disconnectDevice(device1);

      expect(bluetoothService.isConnected(device1)).toBe(false);
      expect(bluetoothService.isConnected(device2)).toBe(true);
    });
  });
});
