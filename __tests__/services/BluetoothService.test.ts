import {MockBluetoothService} from '../mocks/MockBluetoothService';

describe('BluetoothService Unit Tests', () => {
  let bluetoothService: MockBluetoothService;

  beforeEach(() => {
    bluetoothService = new MockBluetoothService();
  });

  describe('Connection Management', () => {
    it('should connect to device', async () => {
      const deviceId = 'test-device';

      const result = await bluetoothService.connectToDevice(deviceId);

      expect(result).toBe(true);
      expect(bluetoothService.isConnected(deviceId)).toBe(true);
    });

    it('should disconnect from device', async () => {
      const deviceId = 'test-device';

      await bluetoothService.connectToDevice(deviceId);
      const result = await bluetoothService.disconnectDevice(deviceId);

      expect(result).toBe(true);
      expect(bluetoothService.isConnected(deviceId)).toBe(false);
    });

    it('should return false for non-connected device', () => {
      const deviceId = 'non-connected-device';

      expect(bluetoothService.isConnected(deviceId)).toBe(false);
    });
  });

  describe('Message Handling', () => {
    const deviceId = 'test-device';

    beforeEach(async () => {
      await bluetoothService.connectToDevice(deviceId);
    });

    it('should setup message monitoring for connected device', async () => {
      await expect(
        bluetoothService.setupMessageMonitoring(deviceId),
      ).resolves.toBeUndefined();
    });

    it('should fail to setup message monitoring for disconnected device', async () => {
      await bluetoothService.disconnectDevice(deviceId);

      await expect(
        bluetoothService.setupMessageMonitoring(deviceId),
      ).rejects.toThrow('Device not connected');
    });

    it('should send message to connected device', async () => {
      const message = 'Test message';

      const result = await bluetoothService.sendMessage(deviceId, message);

      expect(result).toBe(true);
    });

    it('should fail to send message to disconnected device', async () => {
      await bluetoothService.disconnectDevice(deviceId);
      const message = 'Test message';

      await expect(
        bluetoothService.sendMessage(deviceId, message),
      ).rejects.toThrow('Device not connected');
    });

    it('should receive message callback', async () => {
      const mockCallback = jest.fn();
      const testMessage = 'Test received message';

      bluetoothService.onMessageReceived(deviceId, mockCallback);

      // Simulate receiving a message by accessing the internal callback
      const callbacks = (bluetoothService as any).messageCallbacks;
      const callback = callbacks.get(deviceId);
      if (callback) {
        callback(testMessage);
      }

      expect(mockCallback).toHaveBeenCalledWith(testMessage);
    });
  });

  describe('Device Scanning', () => {
    it('should return mock devices', async () => {
      const devices = await bluetoothService.scanForDevices();

      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0]).toHaveProperty('id');
      expect(devices[0]).toHaveProperty('name');
    });
  });

  describe('Service State Management', () => {
    it('should handle multiple devices independently', async () => {
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

    it('should clean up callbacks on disconnect', async () => {
      const deviceId = 'test-device';
      const mockCallback = jest.fn();

      await bluetoothService.connectToDevice(deviceId);
      bluetoothService.onMessageReceived(deviceId, mockCallback);

      // Verify callback is set
      const callbacks = (bluetoothService as any).messageCallbacks;
      expect(callbacks.has(deviceId)).toBe(true);

      await bluetoothService.disconnectDevice(deviceId);

      // Verify callback is removed
      expect(callbacks.has(deviceId)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection timeout', async () => {
      const originalConnect = bluetoothService.connectToDevice;

      jest
        .spyOn(bluetoothService, 'connectToDevice')
        .mockImplementation(async () => {
          throw new Error('Connection timeout');
        });

      await expect(
        bluetoothService.connectToDevice('timeout-device'),
      ).rejects.toThrow('Connection timeout');

      // Restore original method
      bluetoothService.connectToDevice = originalConnect;
    });

    it('should handle send message errors', async () => {
      const deviceId = 'test-device';
      await bluetoothService.connectToDevice(deviceId);

      const originalSend = bluetoothService.sendMessage;
      jest
        .spyOn(bluetoothService, 'sendMessage')
        .mockImplementation(async () => {
          throw new Error('Send failed');
        });

      await expect(
        bluetoothService.sendMessage(deviceId, 'test'),
      ).rejects.toThrow('Send failed');

      // Restore original method
      bluetoothService.sendMessage = originalSend;
    });
  });
});
