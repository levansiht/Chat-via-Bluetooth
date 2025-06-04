import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useBluetoothService} from '../services/BluetoothProvider';
import ChatService from '../services/ChatService';
import DatabaseService from '../database/DatabaseService';
import Message from '../database/models/Message';
import {RootStackParamList} from '../navigation';

type ChatScreenParams = {
  deviceId: string;
  deviceName: string;
};

type ChatScreenRouteProp = RouteProp<
  {ChatScreen: ChatScreenParams},
  'ChatScreen'
>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const {bluetoothService} = useBluetoothService();
  const {deviceId, deviceName} = route.params;

  useEffect(() => {
    ChatService.setBluetoothService(bluetoothService);

    navigation.setOptions({
      title: deviceName || 'Chat',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Clear Chat History',
              'Are you sure you want to clear all messages?',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: clearChatHistory,
                },
              ],
            );
          }}>
          <Icon name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      ),
    });

    loadMessages();

    setupMessageSubscription();

    return () => {
      bluetoothService.removeMessageListener(deviceId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, bluetoothService]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chatHistory = await ChatService.loadChatHistory(deviceId);
      setMessages(chatHistory);
      setIsLoading(false);

      setTimeout(() => {
        if (chatHistory.length > 0 && scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({animated: false});
        }
      }, 200);
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsLoading(false);
    }
  };

  const setupMessageSubscription = () => {
    bluetoothService.addMessageListener(
      deviceId,
      async (receivedDeviceId, messageText) => {
        const newMessage = await DatabaseService.saveMessage(
          receivedDeviceId,
          messageText,
          false,
        );

        setMessages(prevMessages => [...prevMessages, newMessage]);

        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({animated: true});
          }
        }, 100);
      },
    );
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) {
      return;
    }

    const messageToSend = inputMessage.trim();
    setInputMessage('');

    try {
      const success = await ChatService.sendMessage(deviceId, messageToSend);

      if (!success) {
        Alert.alert(
          'Error',
          'Failed to send message. Please check device connection.',
        );
      }

      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const clearChatHistory = async () => {
    try {
      await ChatService.clearChatHistory(deviceId);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      Alert.alert('Error', 'Failed to clear chat history');
    }
  };

  const groupedMessages = () => {
    const groups: {[date: string]: Message[]} = {};

    messages.forEach(message => {
      const date = message.formattedDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, groupMessages]) => ({
      date,
      messages: groupMessages,
    }));
  };

  const renderMessage = ({item}: {item: Message}) => {
    if (item.isSentByMe) {
      return (
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.messageContainer, styles.sentMessage]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <Text style={[styles.messageText, styles.sentMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, styles.sentMessageTime]}>
            {item.formattedTime}
          </Text>
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.messageContainer, styles.receivedMessage]}>
        <Text style={[styles.messageText, styles.receivedMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, styles.receivedMessageTime]}>
          {item.formattedTime}
        </Text>
      </View>
    );
  };

  const renderDateSeparator = ({
    date,
    messages: groupMessages,
  }: {
    date: string;
    messages: Message[];
  }) => {
    return (
      <View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{date}</Text>
        </View>
        {groupMessages.map(message => (
          <View key={message.id}>{renderMessage({item: message})}</View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}>
        {groupedMessages().length === 0 ? (
          <View style={styles.emptyChat}>
            <Icon name="chat-bubble-outline" size={80} color="#cbd5e0" />
            <Text style={styles.emptyChatText}>Ready to Chat! 💬</Text>
            <Text style={styles.emptyChatSubtext}>
              Send your first message to start the conversation with this
              Bluetooth device.
            </Text>
          </View>
        ) : (
          groupedMessages().map(item => (
            <View key={item.date}>{renderDateSeparator(item)}</View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type your message..."
          placeholderTextColor="#a0aec0"
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} disabled={!inputMessage.trim()}>
          <LinearGradient
            colors={
              inputMessage.trim()
                ? ['#667eea', '#764ba2']
                : ['#cbd5e0', '#a0aec0']
            }
            style={[
              styles.sendButton,
              !inputMessage.trim() && styles.sendButtonDisabled,
            ]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Icon
              name="send"
              size={24}
              color={inputMessage.trim() ? '#FFFFFF' : '#718096'}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
    marginVertical: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
    marginLeft: 60,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
    marginRight: 60,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#2d3748',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-end',
  },
  receivedMessageTime: {
    color: '#a0aec0',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateSeparatorText: {
    backgroundColor: 'rgba(113, 128, 150, 0.1)',
    color: '#718096',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4a5568',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
});

export default ChatScreen;
