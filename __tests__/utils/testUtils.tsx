import React from 'react';
import {render} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';

// Mock Bluetooth Provider for testing
export const MockBluetoothProvider = ({children, mockService}: any) => {
  const mockContext = {
    bluetoothService: mockService || {
      disconnectDevice: jest.fn(),
      setupMessageMonitoring: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      scanForDevices: jest.fn(),
      connectToDevice: jest.fn(),
      sendMessage: jest.fn(),
      onMessageReceived: jest.fn(),
    },
  };

  return React.createElement(
    'MockBluetoothProvider',
    {value: mockContext},
    children,
  );
};

// Test wrapper component
export const TestWrapper = ({children, mockBluetoothService}: any) => {
  return (
    <NavigationContainer>
      <MockBluetoothProvider mockService={mockBluetoothService}>
        {children}
      </MockBluetoothProvider>
    </NavigationContainer>
  );
};

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  {mockBluetoothService, ...renderOptions}: any = {},
) => {
  const Wrapper = ({children}: {children: React.ReactNode}) => (
    <TestWrapper mockBluetoothService={mockBluetoothService}>
      {children}
    </TestWrapper>
  );

  return render(ui, {wrapper: Wrapper, ...renderOptions});
};

// Common test data
export const mockDeviceData = {
  deviceId: 'test-device-123',
  deviceName: 'Test BLE Device',
};

export const mockNavigationProps = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  dispatch: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  reset: jest.fn(),
  setParams: jest.fn(),
};

export const mockRouteProps = {
  key: 'test-key',
  name: 'DeviceScreen',
  params: mockDeviceData,
  path: undefined,
};

// Helper to create mock bluetooth service with custom behavior
export const createMockBluetoothService = (overrides: any = {}) => ({
  disconnectDevice: jest.fn().mockResolvedValue(true),
  setupMessageMonitoring: jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn().mockReturnValue(true),
  scanForDevices: jest.fn().mockResolvedValue([]),
  connectToDevice: jest.fn().mockResolvedValue(true),
  sendMessage: jest.fn().mockResolvedValue(true),
  onMessageReceived: jest.fn(),
  ...overrides,
});

// Helper to wait for async operations
export const waitForAsync = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Helper to create test messages
export const createTestMessage = (
  content: string,
  sender: 'user' | 'device' = 'user',
) => ({
  id: `msg-${Date.now()}`,
  content,
  sender,
  timestamp: new Date(),
  deviceId: mockDeviceData.deviceId,
});

// Helper for testing error scenarios
export const createRejectedPromise = (error: string) =>
  Promise.reject(new Error(error));
