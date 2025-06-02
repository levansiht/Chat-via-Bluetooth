import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
  const flatListRef = useRef<FlatList>(null);
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const {bluetoothService, useMockService} = useBluetoothService();
  const {deviceId, deviceName} = route.params;

  useEffect(() => {
    // Set the chat service with the current bluetooth service
    ChatService.setBluetoothService(bluetoothService);

    // Set up the navigation header
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

    // Load chat history
    loadMessages();

    // Set up subscription for new messages
    setupMessageSubscription();

    // Clean up when unmounting
    return () => {
      bluetoothService.removeMessageListener(deviceId);
    };
  }, [deviceId, bluetoothService]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chatHistory = await ChatService.loadChatHistory(deviceId);
      setMessages(chatHistory);
      setIsLoading(false);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (chatHistory.length > 0 && flatListRef.current) {
          flatListRef.current.scrollToEnd({animated: false});
        }
      }, 200);
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsLoading(false);
    }
  };

  const setupMessageSubscription = () => {
    // Set up listener for new messages from the device
    bluetoothService.addMessageListener(
      deviceId,
      async (deviceId, messageText) => {
        // Save the message to database
        const newMessage = await DatabaseService.saveMessage(
          deviceId,
          messageText,
          false,
        );

        // Update the UI
        setMessages(prevMessages => [...prevMessages, newMessage]);

        // Scroll to bottom
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({animated: true});
          }
        }, 100);
      },
    );
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');

    try {
      // Save and send the message
      const success = await ChatService.sendMessage(deviceId, messageToSend);

      if (!success && !useMockService) {
        Alert.alert(
          'Error',
          'Failed to send message. Please check device connection.',
        );
      }

      // Reload messages to display the sent message
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

  // Group messages by date
  const groupedMessages = () => {
    const groups: {[date: string]: Message[]} = {};

    messages.forEach(message => {
      const date = message.formattedDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    // Convert groups to array for FlatList
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  };

  const renderMessage = ({item}: {item: Message}) => {
    return (
      <View
        style={[
          styles.messageContainer,
          item.isSentByMe ? styles.sentMessage : styles.receivedMessage,
        ]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTime}>{item.formattedTime}</Text>
      </View>
    );
  };

  const renderDateSeparator = ({
    date,
    messages,
  }: {
    date: string;
    messages: Message[];
  }) => {
    return (
      <View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{date}</Text>
        </View>
        {messages.map(message => (
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
      {useMockService && (
        <View style={styles.mockBanner}>
          <Text style={styles.mockBannerText}>
            MOCK MODE - Auto-replies enabled
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={groupedMessages()}
        keyExtractor={item => item.date}
        renderItem={({item}) => renderDateSeparator(item)}
        contentContainerStyle={styles.messagesListContent}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Icon name="chat-bubble-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyChatText}>No messages yet</Text>
            <Text style={styles.emptyChatSubtext}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputMessage.trim()}>
          <Icon
            name="send"
            size={24}
            color={inputMessage.trim() ? '#FFFFFF' : '#AAAAAA'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0B93F6',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B93F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#DDDDDD',
  },
  headerButton: {
    marginRight: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    margin: 16,
  },
  dateSeparatorText: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  mockBanner: {
    backgroundColor: '#FFC107',
    padding: 8,
    alignItems: 'center',
  },
  mockBannerText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default ChatScreen;
