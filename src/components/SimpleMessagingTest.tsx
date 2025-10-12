import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { reverbMessagingService } from '../services/reverbMessagingService';

const SimpleMessagingTest: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConversations();
    
    // Listen for new messages
    const handleNewMessage = (message: any) => {
      console.log('📨 New message received:', message);
      if (selectedConversation === message.conversation_id) {
        setMessages(prev => [...prev, message]);
      }
    };

    reverbMessagingService.onMessage(handleNewMessage);

    return () => {
      reverbMessagingService.off('message', handleNewMessage);
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading conversations...');
      const convos = await reverbMessagingService.getConversations();
      console.log('📋 Conversations loaded:', convos);
      setConversations(convos);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading messages for conversation:', conversationId);
      const msgs = await reverbMessagingService.getMessages(conversationId);
      console.log('💬 Messages loaded:', msgs);
      setMessages(msgs);
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !receiverId.trim()) {
      Alert.alert('Error', 'Please enter a message and receiver ID');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📤 Sending message to:', receiverId);
      const message = await reverbMessagingService.sendMessage(receiverId, newMessage);
      console.log('✅ Message sent:', message);
      
      // Add message to current conversation if it matches
      if (selectedConversation === message.conversation_id) {
        setMessages(prev => [...prev, message]);
      }
      
      setNewMessage('');
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = async () => {
    if (!receiverId.trim()) {
      Alert.alert('Error', 'Please enter a receiver ID');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Starting conversation with:', receiverId);
      const result = await reverbMessagingService.startConversation(receiverId);
      console.log('✅ Conversation started:', result);
      
      // Load the new conversation
      await loadConversations();
      Alert.alert('Success', 'Conversation started successfully');
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const enableRealtime = async () => {
    try {
      await reverbMessagingService.enableRealtimeMessaging();
      Alert.alert('Success', 'Real-time messaging enabled');
    } catch (error) {
      console.error('❌ Error enabling real-time messaging:', error);
      Alert.alert('Error', 'Failed to enable real-time messaging');
    }
  };

  const testAuth = async () => {
    try {
      setIsLoading(true);
      const result = await reverbMessagingService.testAuthentication();
      if (result.success) {
        Alert.alert('Authentication Test', `✅ ${result.message}\n\nUser: ${JSON.stringify(result.user, null, 2)}`);
      } else {
        Alert.alert('Authentication Test', `❌ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error testing authentication:', error);
      Alert.alert('Error', 'Failed to test authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Messaging Test</Text>
      
      {/* Controls */}
      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          placeholder="Receiver ID"
          value={receiverId}
          onChangeText={setReceiverId}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={startConversation}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Start Conversation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={enableRealtime}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Enable Realtime</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={testAuth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Auth</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.quaternaryButton]}
            onPress={loadConversations}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversations ({conversations.length})</Text>
        <ScrollView style={styles.conversationsList}>
          {conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.conversation_id}
              style={[
                styles.conversationItem,
                selectedConversation === conversation.conversation_id && styles.selectedConversation
              ]}
              onPress={() => loadMessages(conversation.conversation_id)}
            >
              <Text style={styles.conversationName}>
                {conversation.other_user?.name || 'Unknown User'}
              </Text>
              <Text style={styles.conversationId}>
                ID: {conversation.conversation_id}
              </Text>
              {conversation.last_message && (
                <Text style={styles.lastMessage}>
                  {conversation.last_message.message}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages */}
      {selectedConversation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages ({messages.length})</Text>
          <ScrollView style={styles.messagesList}>
            {messages.map((message) => (
              <View key={message.id} style={styles.messageItem}>
                <Text style={styles.messageSender}>
                  {message.sender?.name || 'Unknown'}: 
                </Text>
                <Text style={styles.messageText}>{message.message}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          {/* Send Message */}
          <View style={styles.sendMessageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.button, styles.sendButton]}
              onPress={sendMessage}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  controls: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  tertiaryButton: {
    backgroundColor: '#17a2b8',
  },
  quaternaryButton: {
    backgroundColor: '#28a745',
  },
  sendButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  conversationsList: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  conversationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedConversation: {
    backgroundColor: '#e3f2fd',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationId: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  messagesList: {
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  messageItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  messageSender: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  messageText: {
    marginTop: 4,
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sendMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    maxHeight: 100,
  },
});

export default SimpleMessagingTest;
