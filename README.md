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
│   │   └── BluetoothProvider.tsx # Provider for Bluetooth functionality
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
