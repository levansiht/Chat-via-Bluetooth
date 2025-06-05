import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import DeviceScreen from '../../src/screens/DeviceScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({
    params: {
      deviceId: 'test-device-123',
      deviceName: 'Test BLE Device',
    },
  }),
}));

// Mock BluetoothService
const mockBluetoothService = {
  disconnectDevice: jest.fn(),
  setupMessageMonitoring: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
};

jest.mock('../../src/services/BluetoothProvider', () => ({
  useBluetoothService: () => ({
    bluetoothService: mockBluetoothService,
  }),
}));

// Mock ChatService
jest.mock('../../src/services/ChatService', () => ({
  __esModule: true,
  default: {
    setBluetoothService: jest.fn(),
  },
}));

// Mock LinearGradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('DeviceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations to avoid test interference
    mockBluetoothService.disconnectDevice.mockResolvedValue(undefined);
    mockBluetoothService.setupMessageMonitoring.mockResolvedValue(undefined);
    mockBluetoothService.isConnected.mockReturnValue(true);
    });
  });

  const renderDeviceScreen = () => {
    return render(<DeviceScreen />);
  };

  describe('Device Information Display', () => {
    it('should display device information correctly', () => {
      const {getByText} = renderDeviceScreen();

      expect(getByText('📱 Device Information')).toBeTruthy();
      expect(getByText('Test BLE Device')).toBeTruthy();
      expect(getByText('test-device-123')).toBeTruthy();
      expect(getByText('🟢 Connected')).toBeTruthy();
    });

    it('should display communication section', () => {
      const {getByText} = renderDeviceScreen();

      expect(getByText('💬 Communication')).toBeTruthy();
      expect(getByText('Start Chatting')).toBeTruthy();
      expect(
        getByText(
          'Send and receive messages with this device over Bluetooth Low Energy connection.',
        ),
      ).toBeTruthy();
    });
  });

  describe('Chat Functionality', () => {
    it('should navigate to chat screen when chat button is pressed', async () => {
      mockBluetoothService.setupMessageMonitoring.mockResolvedValue(undefined);

      const {getByText} = renderDeviceScreen();
      const chatButton = getByText('Start Chatting');

      fireEvent.press(chatButton);

      await waitFor(() => {
        expect(
          mockBluetoothService.setupMessageMonitoring,
        ).toHaveBeenCalledWith('test-device-123');
        expect(mockNavigate).toHaveBeenCalledWith('ChatScreen', {
          deviceId: 'test-device-123',
          deviceName: 'Test BLE Device',
        });
      });
    });

    it('should show error alert when chat setup fails', async () => {
      mockBluetoothService.setupMessageMonitoring.mockRejectedValue(
        new Error('Setup failed'),
      );

      const {getByText} = renderDeviceScreen();
      const chatButton = getByText('Start Chatting');

      fireEvent.press(chatButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to prepare chat functionality',
        );
      });
    });
  });

  describe('Connection Management', () => {
    it('should disconnect device when disconnect button is pressed', async () => {
      mockBluetoothService.disconnectDevice.mockResolvedValue(true);

      const {getByText} = renderDeviceScreen();
      const disconnectButton = getByText('🔌 Disconnect Device');

      fireEvent.press(disconnectButton);

      await waitFor(() => {
        expect(mockBluetoothService.disconnectDevice).toHaveBeenCalledWith(
          'test-device-123',
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Disconnected',
          'Disconnected from Test BLE Device',
          [{text: 'OK', onPress: expect.any(Function)}],
        );
      });
    });

  describe('Loading States', () => {
    it('should show loading indicator when processing chat setup', async () => {
      mockBluetoothService.setupMessageMonitoring.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      const {getByText} = renderDeviceScreen();
      const chatButton = getByText('Start Chatting');

      fireEvent.press(chatButton);

      expect(getByText('Processing...')).toBeTruthy();
    });

    it('should show loading indicator when processing disconnect', async () => {
      mockBluetoothService.disconnectDevice.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      const {getByText} = renderDeviceScreen();
      const disconnectButton = getByText('🔌 Disconnect Device');

      fireEvent.press(disconnectButton);

      expect(getByText('Processing...')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when disconnect fails', async () => {
      mockBluetoothService.disconnectDevice.mockRejectedValue(
        new Error('Disconnect failed'),
      );

      const {getByText} = renderDeviceScreen();
      const disconnectButton = getByText('🔌 Disconnect Device');

      fireEvent.press(disconnectButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to disconnect from device',
        );
      });
    });
  });

  describe('Header Configuration', () => {
    it('should set navigation options with device name and disconnect button', () => {
      renderDeviceScreen();

      expect(mockSetOptions).toHaveBeenCalledWith({
        title: 'Test BLE Device',
        headerRight: expect.any(Function),
      });
    });
  });
});
