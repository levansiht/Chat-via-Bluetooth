import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import ScanScreen from './screens/ScanScreen';
import DeviceScreen from './screens/DeviceScreen';
import ChatScreen from './screens/ChatScreen';

export type RootStackParamList = {
  ScanScreen: undefined;
  DeviceScreen: {deviceId: string; deviceName?: string};
  ChatScreen: {deviceId: string; deviceName: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ScanScreen">
        <Stack.Screen
          name="ScanScreen"
          component={ScanScreen}
          options={{title: 'BLE Scanner'}}
        />
        <Stack.Screen
          name="DeviceScreen"
          component={DeviceScreen}
          options={({route}) => ({
            title: route.params.deviceName || 'Connected Device',
          })}
        />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={({route}) => ({
            title: `Chat with ${route.params.deviceName || 'Device'}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
