/**
 * BLE Chat App
 * A React Native application for Bluetooth Low Energy communication
 *
 * @format
 */

import React, {useEffect} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, LogBox} from 'react-native';
import Navigation from './src/navigation';
import {Platform} from 'react-native';
import {BluetoothProvider} from './src/services/BluetoothProvider';

// Ignore specific warnings that might come from react-native-ble-plx
LogBox.ignoreLogs([
  'NativeEventEmitter',
  'new NativeEventEmitter',
  'RCTBridge required',
]);

function App(): React.JSX.Element {
  // Android needs to be prompted for permissions at app startup
  useEffect(() => {
    // Permissions are handled in the BluetoothService
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <BluetoothProvider>
        <Navigation />
      </BluetoothProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default App;
