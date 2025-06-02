# BLE Chat App

A React Native application that demonstrates Bluetooth Low Energy (BLE) connectivity using the `react-native-ble-plx` library.

## Features

- Scan for nearby BLE devices
- Connect to BLE devices
- View device information
- Disconnect from devices

## Prerequisites

- Node.js & npm
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Physical devices with Bluetooth capabilities (recommended for testing)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
cd BleChatApp
npm install
```

3. For iOS, install pods:

```bash
cd ios
pod install
cd ..
```

## Running the App

### For Android:

```bash
npx react-native run-android
```

### For iOS:

```bash
npx react-native run-ios
```

## Permissions

This application requires Bluetooth permissions:

### Android

- For Android < 12 (API level 31): `ACCESS_FINE_LOCATION`
- For Android ≥ 12 (API level 31): `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`

### iOS

- NSBluetoothAlwaysUsageDescription (in Info.plist)

## Mock Device Testing

The app includes a mock device testing feature that allows you to simulate Bluetooth devices without needing physical hardware. This is useful for:

- Development without physical devices
- Testing UI flows without Bluetooth hardware
- Demo purposes

To use the mock device feature:

1. Launch the app
2. Toggle the "Use Mock Devices" switch to ON
3. Tap "Scan for Devices" to see simulated devices appear
4. Connect to these virtual devices as you would with real ones

Mock mode is clearly indicated with a "MOCK MODE" label in the app to avoid confusion.

## Troubleshooting

- Make sure Bluetooth is enabled on your device
- For Android, ensure location permissions are granted (Bluetooth scanning requires location permissions)
- Use physical devices for testing as emulators often have limited Bluetooth capabilities

## Project Structure

```
BleChatApp/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Application screens
│   │   ├── ScanScreen.tsx     # Device scanning screen
│   │   └── DeviceScreen.tsx   # Connected device screen
│   ├── services/         # Business logic
│   │   ├── BluetoothService.ts # BLE functionality
│   │   ├── MockBluetoothService.ts # Mock implementation for testing
│   │   └── BluetoothProvider.tsx # Provider to switch between real/mock modes
│   └── navigation.tsx    # Navigation configuration
├── App.tsx              # Main application component
└── ...                  # Other configuration files
```

## Next Steps

- Implement chat functionality between connected devices
- Add support for custom services and characteristics
- Improve device connection reliability
- Enhance the UI/UX

## License

MIT
