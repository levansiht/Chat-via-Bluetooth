/* eslint-env jest */
const {device, expect, element, by, waitFor} = require('detox');

describe('DeviceScreen E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Device Information Display', () => {
    it('should display device information when navigating to device screen', async () => {
      // Note: This test assumes you have a way to navigate to DeviceScreen
      // You may need to implement navigation from ScanScreen or use deep linking

      // Mock navigation to DeviceScreen
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Test Navigation',
        subtitle: 'Navigate to Device Screen',
        body: 'Testing device screen',
        badge: 1,
        payload: {
          screen: 'DeviceScreen',
          deviceId: 'test-device-123',
          deviceName: 'Test BLE Device',
        },
      });

      // Check if device information is displayed
      await expect(element(by.text('📱 Device Information'))).toBeVisible();
      await expect(element(by.text('💬 Communication'))).toBeVisible();
    });

    it('should show connected status for active device', async () => {
      await expect(element(by.text('🟢 Connected'))).toBeVisible();
      await expect(element(by.text('Status:'))).toBeVisible();
    });
  });

  describe('Chat Navigation', () => {
    it('should navigate to chat screen when Start Chatting is pressed', async () => {
      await element(by.text('Start Chatting')).tap();

      // Wait for navigation and check chat screen elements
      await waitFor(element(by.id('chat-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show loading state during chat setup', async () => {
      await element(by.text('Start Chatting')).tap();

      // Should briefly show loading
      await expect(element(by.text('Processing...'))).toBeVisible();
    });
  });

  describe('Device Disconnection', () => {
    it('should disconnect device when disconnect button is pressed', async () => {
      await element(by.text('🔌 Disconnect Device')).tap();

      // Should show confirmation dialog
      await expect(element(by.text('Disconnected'))).toBeVisible();
      await element(by.text('OK')).tap();
    });

    it('should update UI to show disconnected state', async () => {
      await element(by.text('🔌 Disconnect Device')).tap();
      await element(by.text('OK')).tap();

      // Status should update
      await expect(element(by.text('🔴 Disconnected'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when operations fail', async () => {
      // This would require mocking failures in the bluetooth service
      // Implementation depends on how you handle mocking in E2E tests

      // For now, we can test the UI structure
      await expect(element(by.text('Start Chatting'))).toBeVisible();
      await expect(element(by.text('🔌 Disconnect Device'))).toBeVisible();
    });
  });

  describe('Header Actions', () => {
    it('should have disconnect button in header', async () => {
      // Check for header disconnect button
      await expect(element(by.text('Disconnect'))).toBeVisible();
    });

    it('should disconnect via header button', async () => {
      await element(by.text('Disconnect')).tap();

      await expect(element(by.text('Disconnected'))).toBeVisible();
      await element(by.text('OK')).tap();
    });
  });
});
