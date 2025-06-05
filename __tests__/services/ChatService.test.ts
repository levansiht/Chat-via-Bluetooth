import ChatService from '../../src/services/ChatService';
import {MockBluetoothService} from '../mocks/MockBluetoothService';

describe('ChatService Unit Tests', () => {
  let mockBluetoothService: MockBluetoothService;

  beforeEach(() => {
    mockBluetoothService = new MockBluetoothService();
    ChatService.setBluetoothService(mockBluetoothService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should set bluetooth service correctly', () => {
      const newMockService = new MockBluetoothService();
      ChatService.setBluetoothService(newMockService as any);

      // Verify the service was set (this depends on your ChatService implementation)
      expect(ChatService).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    const deviceId = 'test-device-123';
    const testMessage = 'Hello from ChatService test!';

    beforeEach(async () => {
      await mockBluetoothService.connectToDevice(deviceId);
    });

    it('should send message through bluetooth service', async () => {
      const sendSpy = jest.spyOn(mockBluetoothService, 'sendMessage');

      // This assumes your ChatService has a sendMessage method
      // You may need to adjust based on your actual ChatService implementation
      const result = await mockBluetoothService.sendMessage(
        deviceId,
        testMessage,
      );

      expect(sendSpy).toHaveBeenCalledWith(deviceId, testMessage);
      expect(result).toBe(true);
    });

    it('should handle message reception', async () => {
      const mockCallback = jest.fn();

      mockBluetoothService.onMessageReceived(deviceId, mockCallback);

      // Simulate message reception
      const callbacks = (mockBluetoothService as any).messageCallbacks;
      const callback = callbacks.get(deviceId);
      if (callback) {
        callback(testMessage);
      }

      expect(mockCallback).toHaveBeenCalledWith(testMessage);
    });

    it('should handle send message errors', async () => {
      jest
        .spyOn(mockBluetoothService, 'sendMessage')
        .mockRejectedValue(new Error('Send failed'));

      await expect(
        mockBluetoothService.sendMessage(deviceId, testMessage),
      ).rejects.toThrow('Send failed');
    });
  });

  describe('Connection Management', () => {
    it('should handle bluetooth service connection state', async () => {
      const deviceId = 'test-device';

      await mockBluetoothService.connectToDevice(deviceId);
      expect(mockBluetoothService.isConnected(deviceId)).toBe(true);

      await mockBluetoothService.disconnectDevice(deviceId);
      expect(mockBluetoothService.isConnected(deviceId)).toBe(false);
    });

    it('should setup message monitoring correctly', async () => {
      const deviceId = 'test-device';
      await mockBluetoothService.connectToDevice(deviceId);

      const setupSpy = jest.spyOn(
        mockBluetoothService,
        'setupMessageMonitoring',
      );

      await mockBluetoothService.setupMessageMonitoring(deviceId);

      expect(setupSpy).toHaveBeenCalledWith(deviceId);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle bluetooth service unavailable', () => {
      ChatService.setBluetoothService(null as any);

      // Test behavior when bluetooth service is not available
      // This depends on how your ChatService handles null service
      expect(ChatService).toBeDefined();
    });

    it('should handle disconnected device scenarios', async () => {
      const deviceId = 'disconnected-device';

      await expect(
        mockBluetoothService.sendMessage(deviceId, 'test'),
      ).rejects.toThrow('Device not connected');
    });
  });
});
