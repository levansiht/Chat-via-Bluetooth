import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
  const {bluetoothService} = useBluetoothService();

  const {deviceId, deviceName} = route.params;

  useEffect(() => {
    checkConnectionStatus();

    navigation.setOptions({
      title: deviceName || 'Connected Device',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerDisconnectButton}
          onPress={handleDisconnect}>
          <Text style={styles.headerDisconnectText}>Disconnect</Text>
        </TouchableOpacity>
      ),
    });

    return () => {
      if (isConnected) {
        bluetoothService.disconnectDevice(deviceId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bluetoothService]);

  const checkConnectionStatus = async () => {};

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
      ChatService.setBluetoothService(bluetoothService);

      await bluetoothService.setupMessageMonitoring(deviceId);

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
          <Text style={styles.cardTitle}>📱 Device Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {deviceName || 'Unknown Device'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device ID:</Text>
            <Text style={styles.infoValue}>{deviceId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text
              style={[
                styles.infoValue,
                isConnected
                  ? styles.connectedStatus
                  : styles.disconnectedStatus,
              ]}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Communication</Text>
          <View style={styles.chatSection}>
            <TouchableOpacity
              onPress={navigateToChatScreen}
              disabled={!isConnected}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.chatButton}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Icon name="chat" size={28} color="#FFFFFF" />
                <Text style={styles.chatButtonText}>Start Chatting</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.chatDescription}>
              Send and receive messages with this device over Bluetooth Low
              Energy connection.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleDisconnect} disabled={!isConnected}>
          <LinearGradient
            colors={
              isConnected ? ['#e53e3e', '#c53030'] : ['#a0aec0', '#718096']
            }
            style={[
              styles.disconnectButton,
              !isConnected && styles.disconnectButtonDisabled,
            ]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.disconnectButtonText}>
              🔌 Disconnect Device
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  headerDisconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    marginRight: 8,
  },
  headerDisconnectText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#2d3748',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#2d3748',
    textAlign: 'center',
  },
  chatSection: {
    alignItems: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  chatDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  disconnectButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#e53e3e',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disconnectButtonDisabled: {
    backgroundColor: '#a0aec0',
    shadowOpacity: 0,
    elevation: 0,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  connectedStatus: {
    color: '#38a169',
    fontWeight: '600',
  },
  disconnectedStatus: {
    color: '#e53e3e',
    fontWeight: '600',
  },
});

export default DeviceScreen;
