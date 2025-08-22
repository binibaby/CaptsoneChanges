import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
  id: string;
  senderName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatar: any;
  isOnline: boolean;
  petName?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  time: string;
  isFromMe: boolean;
}

interface SupportMessage {
  id: string;
  text: string;
  time: string;
  isFromAdmin: boolean;
}

const PetOwnerMessagesScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    // New users start with no messages
  ]);

  const [selectedChat, setSelectedChat] = useState<Message | null>(null);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    // New users start with no chat messages
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleBack = () => {
    if (selectedChat) {
      setSelectedChat(null);
    } else {
      router.back();
    }
  };

  const handleChatPress = (message: Message) => {
    setSelectedChat(message);
    // Mark messages as read
    setMessages(prev => 
      prev.map(m => 
        m.id === message.id ? { ...m, unreadCount: 0 } : m
      )
    );
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        text: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: true,
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleSupportChat = async () => {
    setShowSupportChat(true);
    // Initialize support chat if first time
    if (!supportTicketId) {
      try {
        // In a real implementation, this would use the support service
        // const chatSession = await supportService.startSupportChat();
        // setSupportTicketId(chatSession.ticket.id);
        // setSupportMessages(chatSession.messages);
        
        // For now, use mock data
        setSupportTicketId('support-' + Date.now());
        setSupportMessages([
          {
            id: '1',
            text: 'Hello! How can we help you today?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isFromAdmin: true,
          }
        ]);
      } catch (error) {
        Alert.alert('Error', 'Failed to start support chat. Please try again.');
        setShowSupportChat(false);
      }
    }
  };

  const handleSendSupportMessage = async () => {
    if (newMessage.trim() && supportTicketId) {
      try {
        // In a real implementation, this would send the message via API
        // await supportService.sendMessage(supportTicketId, newMessage);
        
        // For now, add the message locally
        const message: SupportMessage = {
          id: Date.now().toString(),
          text: newMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromAdmin: false,
        };
        setSupportMessages(prev => [...prev, message]);
        setNewMessage('');
        
        // Simulate admin response after 2 seconds
        setTimeout(() => {
          const adminResponse: SupportMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Thank you for reaching out. An admin will respond to you shortly. In the meantime, is there anything specific I can help you with?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isFromAdmin: true,
          };
          setSupportMessages(prev => [...prev, adminResponse]);
        }, 2000);
      } catch (error) {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    }
  };

  const handleBackFromSupport = () => {
    setShowSupportChat(false);
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      style={styles.messageItem} 
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Image source={item.avatar} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.senderName}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        
        {item.petName && (
          <Text style={styles.petName}>Pet: {item.petName}</Text>
        )}
        
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderChatMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.chatMessage,
      item.isFromMe ? styles.myMessage : styles.theirMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isFromMe ? styles.myMessageText : styles.theirMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.messageTime,
        item.isFromMe ? styles.myMessageTime : styles.theirMessageTime
      ]}>
        {item.time}
      </Text>
    </View>
  );

  const renderSupportMessage = ({ item }: { item: SupportMessage }) => (
    <View style={[
      styles.chatMessage,
      item.isFromAdmin ? styles.theirMessage : styles.myMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isFromAdmin ? styles.theirMessageText : styles.myMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.messageTime,
        item.isFromAdmin ? styles.theirMessageTime : styles.myMessageTime
      ]}>
        {item.time}
      </Text>
    </View>
  );

  if (selectedChat) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Image source={selectedChat.avatar} style={styles.chatAvatar} />
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderName}>{selectedChat.senderName}</Text>
              <Text style={styles.chatHeaderStatus}>
                {selectedChat.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <FlatList
          data={chatMessages}
          renderItem={renderChatMessage}
          keyExtractor={(item) => item.id}
          style={styles.chatMessages}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.messageInput}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? '#fff' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Support Chat Interface
  if (showSupportChat) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Support Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackFromSupport}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <View style={styles.supportAvatar}>
              <Ionicons name="headset" size={20} color="#fff" />
            </View>
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderName}>Support Team</Text>
              <Text style={styles.chatHeaderStatus}>We're here to help</Text>
            </View>
          </View>
        </View>

        {/* Support Messages */}
        <FlatList
          data={supportMessages}
          renderItem={renderSupportMessage}
          keyExtractor={(item) => item.id}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
        />

        {/* Support Message Input */}
        <View style={styles.messageInput}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message to support..."
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendSupportMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? '#fff' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupportChat}>
            <Ionicons name="headset" size={20} color="#4A90E2" />
            <Text style={styles.supportButtonText}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>When you book with pet sitters, you can message them here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  supportButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '600',
  },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  petName: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderText: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 5,
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  chatMessage: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 4,
  },
  theirMessageTime: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#F59E0B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PetOwnerMessagesScreen; 