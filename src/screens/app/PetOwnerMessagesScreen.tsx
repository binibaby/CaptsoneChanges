import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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

const PetOwnerMessagesScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderName: 'Sarah Johnson',
      lastMessage: 'Hi John! I\'d be happy to help with Max. What time do you need me?',
      time: '2 min ago',
      unreadCount: 1,
      avatar: require('../../assets/images/default-avatar.png'),
      isOnline: true,
      petName: 'Max',
    },
    {
      id: '2',
      senderName: 'Emma Wilson',
      lastMessage: 'Luna is a bit shy at first but warms up quickly. She loves to be brushed.',
      time: '15 min ago',
      unreadCount: 0,
      avatar: require('../../assets/images/default-avatar.png'),
      isOnline: false,
      petName: 'Luna',
    },
    {
      id: '3',
      senderName: 'Mike Chen',
      lastMessage: 'Thanks for booking with me! I\'ll take great care of Max.',
      time: '1 hour ago',
      unreadCount: 0,
      avatar: require('../../assets/images/default-avatar.png'),
      isOnline: true,
      petName: 'Max',
    },
    {
      id: '4',
      senderName: 'Lisa Park',
      lastMessage: 'I\'m available this weekend if you need someone for Luna.',
      time: '2 hours ago',
      unreadCount: 2,
      avatar: require('../../assets/images/default-avatar.png'),
      isOnline: false,
      petName: 'Luna',
    },
  ]);

  const [selectedChat, setSelectedChat] = useState<Message | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hi John! I\'d be happy to help with Max. What time do you need me?',
      time: '2:30 PM',
      isFromMe: false,
    },
    {
      id: '2',
      text: 'Hi Sarah! I need someone from 2 PM to 4 PM on Saturday.',
      time: '2:32 PM',
      isFromMe: true,
    },
    {
      id: '3',
      text: 'Perfect! I\'m available at that time. What\'s your address?',
      time: '2:33 PM',
      isFromMe: false,
    },
    {
      id: '4',
      text: '123 Main St, San Francisco. Max is very friendly and loves to play fetch.',
      time: '2:35 PM',
      isFromMe: true,
    },
    {
      id: '5',
      text: 'Great! I\'ll see you and Max on Saturday at 2 PM.',
      time: '2:36 PM',
      isFromMe: false,
    },
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
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