import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBluetoothService} from '../services/BluetoothProvider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ChatService from '../services/ChatService';
import {RootStackParamList} from '../navigation';

type DeviceScreenParams = {
  deviceId: string;
  deviceName: string;
};

type DeviceScreenRouteProp = RouteProp<
  {DeviceScreen: DeviceScreenParams},
  'DeviceScreen'
>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DeviceScreen = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const route = useRoute<DeviceScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const {bluetoothService, useMockService} = useBluetoothService();

  const {deviceId, deviceName} = route.params;

  useEffect(() => {
    // Check connection status when component mounts
    checkConnectionStatus();

    // Set up navigation header
    navigation.setOptions({
      title: deviceName || 'Connected Device',
      headerRight: () => (
        <Button onPress={handleDisconnect} title="Disconnect" color="#d9534f" />
      ),
    });

    // Clean up when component unmounts
    return () => {
      if (isConnected) {
        bluetoothService.disconnectDevice(deviceId);
      }
    };
  }, [bluetoothService]);

  const checkConnectionStatus = async () => {
    // Here you could add code to periodically check if device is still connected
    // For now, we'll assume it's connected since we've just connected to it
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await bluetoothService.disconnectDevice(deviceId);
      setIsConnected(false);
      Alert.alert(
        'Disconnected',
        `Disconnected from ${deviceName || 'device'}`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Error', 'Failed to disconnect from device');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToChatScreen = async () => {
    setIsLoading(true);

    try {
      // Set up chat service
      ChatService.setBluetoothService(bluetoothService);

      // Set up message monitoring on the device
      await bluetoothService.setupMessageMonitoring(deviceId);

      // Navigate to chat screen
      navigation.navigate('ChatScreen', {
        deviceId,
        deviceName,
      });
    } catch (error) {
      console.error('Failed to set up chat:', error);
      Alert.alert('Error', 'Failed to prepare chat functionality');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Device Information</Text>
          {useMockService && (
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>MOCK DEVICE</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{deviceName || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID:</Text>
            <Text style={styles.infoValue}>{deviceId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text
              style={[
                styles.infoValue,
                {color: isConnected ? '#5cb85c' : '#d9534f'},
              ]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat</Text>
          <View style={styles.chatSection}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={navigateToChatScreen}
              disabled={!isConnected}>
              <Icon name="chat" size={28} color="#FFFFFF" />
              <Text style={styles.chatButtonText}>Open Chat</Text>
            </TouchableOpacity>
            <Text style={styles.chatDescription}>
              Send and receive messages with this device over Bluetooth.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Disconnect"
          onPress={handleDisconnect}
          color="#d9534f"
          disabled={!isConnected}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  mockBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  mockBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chatSection: {
    alignItems: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chatDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
});

export default DeviceScreen;
