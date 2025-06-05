# Testing Guide for BleChatApp

## 🧪 Test Structure

```
__tests__/
├── setupTests.ts          # Test configuration and mocks
├── utils/
│   └── testUtils.tsx      # Test utilities and helpers
├── mocks/
│   └── MockBluetoothService.ts  # Mock Bluetooth service
├── screens/
│   └── DeviceScreen.test.tsx    # DeviceScreen component tests
├── services/
│   ├── BluetoothService.test.ts # BluetoothService unit tests
│   └── ChatService.test.ts      # ChatService unit tests
└── integration/
    └── BleConnection.test.ts    # Integration tests

e2e/
├── deviceScreen.e2e.js    # End-to-end tests
└── jest.setup.js          # E2E test setup
```

## 🚀 Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests (screens & services)
npm run test:unit

# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Build app for E2E testing
npm run test:e2e:build

# Run E2E tests on emulator
npm run test:e2e:android

# Run E2E tests on real device
npm run test:e2e:device

# Run all E2E tests
npm run test:e2e
```

## 🎯 Testing Strategy

### 1. Unit Tests

- **DeviceScreen.test.tsx**: Tests UI components, user interactions, navigation
- **BluetoothService.test.ts**: Tests BLE service methods and error handling
- **ChatService.test.ts**: Tests chat functionality and message handling

### 2. Integration Tests

- **BleConnection.test.ts**: Tests full BLE connection flow with mock service

### 3. E2E Tests

- **deviceScreen.e2e.js**: Tests complete user flows on real app

## 🔧 Test Configuration

### Jest Config (jest.config.js)

- Preset: `react-native`
- Setup: Custom setup file with mocks
- Coverage: Collects from `src/` directory
- Environment: `jsdom`

### Detox Config (.detoxrc.json)

- Android emulator and device configurations
- Debug and release build variants
- Test runner: Jest with custom setup

## 📱 Testing with Real Devices

### Setup for 2 Android Devices:

```bash
# Check connected devices
adb devices

# Build and install on device 1
npx react-native run-android --device --deviceId=DEVICE1_ID

# Build and install on device 2
npx react-native run-android --device --deviceId=DEVICE2_ID

# Run tests on specific device
npm run test:e2e:device
```

### Manual Testing Checklist:

- [ ] BLE scanning works
- [ ] Device connection successful
- [ ] DeviceScreen displays correct info
- [ ] Chat navigation works
- [ ] Message sending/receiving
- [ ] Disconnect functionality
- [ ] Error handling scenarios

## 🧩 Mock Services

### MockBluetoothService

Simulates real BLE operations:

- Connection management
- Message sending/receiving
- Error scenarios
- Multiple device handling

### Usage in Tests:

```typescript
import {MockBluetoothService} from '../mocks/MockBluetoothService';

const mockService = new MockBluetoothService();
await mockService.connectToDevice('test-device');
```

## 🐛 Debugging Tests

### Common Issues:

1. **Navigation mocks**: Ensure navigation is properly mocked
2. **Async operations**: Use `waitFor` for async assertions
3. **Module mocks**: Check mock implementations match real APIs
4. **E2E timeouts**: Increase timeout for slower operations

### Debug Commands:

```bash
# Run single test file
npm test -- DeviceScreen.test.tsx

# Run tests with verbose output
npm test -- --verbose

# Debug mode
npm test -- --detectOpenHandles
```

## 📊 Coverage Reports

Coverage reports are generated in `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Console output
- **LCOV**: `coverage/lcov.info`

Target coverage: 80%+ for critical components

## 🚨 CI/CD Integration

### GitHub Actions Example:

```yaml
- name: Run Unit Tests
  run: npm run test:coverage

- name: Run E2E Tests
  run: |
    npm run test:e2e:build
    npm run test:e2e:android
```

## 📝 Writing New Tests

### Test Structure:

```typescript
describe('Component/Service Name', () => {
  beforeEach(() => {
    // Setup
  });

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      // Test implementation
    });
  });
});
```

### Best Practices:

- Use descriptive test names
- Test one thing at a time
- Mock external dependencies
- Test both success and error scenarios
- Use async/await for promises
- Clean up after tests
