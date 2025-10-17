import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ProfilePopupModal from '../../components/ProfilePopupModal';
import { useAuth } from '../../contexts/AuthContext';
import { ReverbConversation, ReverbMessage, reverbMessagingService } from '../../services/reverbMessagingService';

interface Message {
  id: string;
  senderName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatar: any;
  isOnline: boolean;
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

const PetSitterMessagesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLocationTracking, user } = useAuth();
  const [conversations, setConversations] = useState<ReverbConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ReverbConversation | null>(null);
  const [messages, setMessages] = useState<ReverbMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasAutoOpenedConversation, setHasAutoOpenedConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // Profile popup state
  const [profilePopupVisible, setProfilePopupVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation =>
    conversation.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle search visibility
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
    }
  };

  // Handle profile click
  const handleProfileClick = async (conversation: ReverbConversation) => {
    console.log('🔍 Profile clicked for:', conversation.other_user.name);
    console.log('🔍 Conversation data:', conversation);
    
    try {
      // Try to fetch detailed profile information from API
      let detailedProfile = null;
      
      try {
        const { default: networkService } = await import('../../services/networkService');
        
        // Fetch user profile
        const profileResponse = await networkService.get(`/api/profile`);
        detailedProfile = profileResponse.data.user;
        console.log('🔍 Fetched detailed profile:', detailedProfile);
      } catch (apiError) {
        console.log('⚠️ Could not fetch detailed profile from API, using conversation data');
      }
      
      // Use detailed profile data if available, otherwise fall back to conversation data
      const profileData = {
        id: conversation.other_user.id,
        name: conversation.other_user.name,
        profile_image: conversation.other_user.profile_image,
        phone: detailedProfile?.phone || conversation.other_user.phone || 'Not provided',
        address: detailedProfile?.address || conversation.other_user.address || 'Not provided',
        rating: detailedProfile?.rating || conversation.other_user.rating || 0,
        role: 'pet_owner' as const,
      };
      
      console.log('🔍 Setting profile data:', profileData);
      setSelectedProfile(profileData);
      setProfilePopupVisible(true);
      console.log('🔍 Profile popup should now be visible');
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile information');
    }
  };

  // Close profile popup
  const handleCloseProfile = () => {
    setProfilePopupVisible(false);
    setSelectedProfile(null);
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      console.log('💬 Sitter: Loading conversations for current user...');
      
      // Load conversations for current sitter
      const data = await reverbMessagingService.getConversations();
      console.log('💬 Sitter conversations loaded:', data.length);
      
      // Additional safety check: verify conversations belong to current user
      const { default: authService } = await import('../../services/authService');
      const currentUser = await authService.getCurrentUser();
      console.log('💬 Sitter current user ID:', currentUser?.id);
      
      if (data && data.length > 0) {
        console.log('💬 Sitter conversation details:', data.map(conv => ({
          conversation_id: conv.conversation_id,
          other_user_id: conv.other_user?.id,
          other_user_name: conv.other_user?.name
        })));
      }
      
      setConversations(data);
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await reverbMessagingService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  }, []);

  // Refresh conversations
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const otherUserId = selectedConversation.other_user.id;
      // Use regular sendMessage for sitter (the service will handle sender identification)
      await reverbMessagingService.sendMessage(otherUserId, newMessage.trim());
      
      // Clear input
      setNewMessage('');
      
      // Reload messages to show the new message
      await loadMessages(selectedConversation.conversation_id);
      
      // Refresh conversations to update last message
      loadConversations();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleBack = () => {
    if (selectedConversation) {
      setSelectedConversation(null);
      setMessages([]);
    } else {
      router.back();
    }
  };

  const handleChatPress = async (conversation: ReverbConversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.conversation_id);
    await reverbMessagingService.markAsRead(conversation.conversation_id);
  };

  // Load current user ID
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { default: authService } = await import('../../services/authService');
        const user = await authService.getCurrentUser();
        console.log('🔍 Loaded user for sitter:', user);
        if (user && user.id) {
          const userId = user.id.toString();
          setCurrentUserId(userId);
          console.log('🔍 Set currentUserId for sitter:', userId);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // Initialize messaging
  useEffect(() => {
    console.log('💬 Initializing messaging in PetSitterMessagesScreen');
    loadConversations();
    
    // Set up real-time event listeners
    reverbMessagingService.onMessage((message: ReverbMessage) => {
      console.log('💬 Real-time message received:', message);
      // Reload messages if it's for the current conversation
      if (selectedConversation && message.conversation_id === selectedConversation.conversation_id) {
        loadMessages(selectedConversation.conversation_id);
      }
      // Reload conversations to update last message
      loadConversations();
    });

    reverbMessagingService.onConversationUpdated((conversationId: string) => {
      console.log('💬 Conversation updated:', conversationId);
      loadConversations();
    });

    // Connect to Reverb if not already connected
    if (!reverbMessagingService.isWebSocketConnected()) {
      reverbMessagingService.connect();
    }
  }, [loadConversations, selectedConversation]);

  // Refresh conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('💬 PetSitterMessagesScreen: Screen focused, refreshing conversations...');
      loadConversations();
    }, [loadConversations])
  );

  // Handle opening specific conversation when conversations are loaded
  useEffect(() => {
    if (params.conversationId && !hasAutoOpenedConversation) {
      console.log('💬 PetSitter: Auto-opening conversation with ID:', params.conversationId);
      console.log('💬 PetSitter: Available conversations:', conversations.map(c => c.conversation_id));
      
      const conversation = conversations.find(c => c.conversation_id === params.conversationId);
      if (conversation) {
        console.log('💬 PetSitter: Found existing conversation, opening chat:', conversation.other_user.name);
        handleChatPress(conversation);
        setHasAutoOpenedConversation(true);
      } else {
        console.log('💬 PetSitter: Conversation not found in list, creating new one');
        // If conversation doesn't exist, create it and open it
        const otherUserId = params.otherUserId;
        if (otherUserId) {
          const newConversation: ReverbConversation = {
            conversation_id: Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId || '',
            other_user: {
              id: Array.isArray(otherUserId) ? otherUserId[0] : otherUserId || '',
              name: Array.isArray(params.otherUserName) ? params.otherUserName[0] : params.otherUserName || `Pet Owner ${Array.isArray(otherUserId) ? otherUserId[0] : otherUserId}`,
              profile_image: Array.isArray(params.otherUserImage) ? params.otherUserImage[0] : params.otherUserImage || null
            },
            last_message: null,
            unread_count: 0,
            updated_at: new Date().toISOString()
          };
          console.log('💬 PetSitter: Created new conversation:', newConversation);
          handleChatPress(newConversation);
          setHasAutoOpenedConversation(true);
        }
      }
    }
  }, [conversations, params.conversationId, params.otherUserId, params.otherUserName, params.otherUserImage, hasAutoOpenedConversation]);

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
    if (supportMessage.trim() && supportTicketId) {
      try {
        // In a real implementation, this would send the message via API
        // await supportService.sendMessage(supportTicketId, supportMessage);
        
        // For now, add the message locally
        const message: SupportMessage = {
          id: Date.now().toString(),
          text: supportMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromAdmin: false,
        };
        setSupportMessages(prev => [...prev, message]);
        setSupportMessage('');
        
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

  const renderConversationItem = ({ item }: { item: ReverbConversation }) => {
    // Debug profile image
    console.log('🔍 Profile image debug (Sitter):', {
      conversationId: item.conversation_id,
      otherUserName: item.other_user.name,
      profileImage: item.other_user.profile_image,
      hasProfileImage: !!item.other_user.profile_image
    });
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem} 
        onPress={() => handleChatPress(item)}
      >
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={(e) => {
            e.stopPropagation();
            console.log('🔍 Avatar clicked for:', item.other_user.name);
            handleProfileClick(item);
          }}
          activeOpacity={0.7}
        >
          {item.other_user.profile_image ? (
            <Image 
              source={{ uri: item.other_user.profile_image }} 
              style={styles.avatar}
              onError={(error) => {
                console.log('❌ Image load error (Sitter) for', item.other_user.name, ':', error.nativeEvent.error);
                console.log('❌ Failed URL (Sitter):', item.other_user.profile_image);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully for (Sitter):', item.other_user.name);
                console.log('✅ Image URL (Sitter):', item.other_user.profile_image);
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.placeholderText}>
                {item.other_user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isLocationTracking && <View style={styles.onlineIndicator} />}
        </TouchableOpacity>
      
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{item.other_user.name}</Text>
            <Text style={styles.conversationTime}>
              {item.last_message ? new Date(item.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
          
          <Text style={styles.conversationLastMessage} numberOfLines={2}>
            {item.last_message ? item.last_message.message : 'Send a message to start chatting'}
          </Text>
        </View>
        
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderChatMessage = ({ item }: { item: ReverbMessage }) => {
    // For sitter screen: current user is "me", others are "them"
    // Use currentUserId state for consistency with PetOwnerMessagesScreen
    const isFromMe = currentUserId ? item.sender_id.toString() === currentUserId.toString() : false;
    const messageTime = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Debug logging
    console.log('🔍 Message debug (Sitter):', {
      messageId: item.id,
      senderId: item.sender_id,
      senderIdType: typeof item.sender_id,
      currentUserId: currentUserId,
      isFromMe: isFromMe,
      message: item.message.substring(0, 20) + '...',
      comparison: currentUserId ? `${item.sender_id.toString()} === ${currentUserId.toString()} = ${item.sender_id.toString() === currentUserId.toString()}` : 'No currentUserId'
    });
    
    return (
      <View style={[
        styles.chatMessage,
        isFromMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isFromMe ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.message}
        </Text>
        <Text style={[
          styles.messageTime,
          isFromMe ? styles.myMessageTime : styles.theirMessageTime
        ]}>
          {messageTime}
        </Text>
      </View>
    );
  };

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

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.chatHeaderInfo}
              onPress={(e) => {
                e.stopPropagation();
                console.log('🔍 Chat header avatar clicked for:', selectedConversation.other_user.name);
                handleProfileClick(selectedConversation);
              }}
              activeOpacity={0.7}
            >
              <Image source={{ uri: selectedConversation.other_user.profile_image || 'https://via.placeholder.com/50' }} style={styles.chatAvatar} />
              <View style={styles.chatHeaderText}>
                <Text style={styles.chatHeaderName}>{selectedConversation.other_user.name}</Text>
                {isLocationTracking && (
                  <Text style={styles.chatHeaderStatus}>
                    Online
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <FlatList
            data={messages}
            renderItem={renderChatMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                <Text style={styles.emptyChatTitle}>Start the conversation</Text>
                <Text style={styles.emptyChatSubtitle}>Send a message to the pet owner to begin chatting</Text>
              </View>
            }
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
        </KeyboardAvoidingView>
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
            value={supportMessage}
            onChangeText={setSupportMessage}
            placeholder="Type your message to support..."
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !supportMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendSupportMessage}
            disabled={!supportMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={supportMessage.trim() ? '#fff' : '#ccc'} 
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
          <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
            <Ionicons name={isSearchVisible ? "close" : "search"} size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      {isSearchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Messages List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.conversation_id}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>When pet owners book your services, you can message them here.</Text>
            <TouchableOpacity 
              style={styles.setAvailabilityButton}
              onPress={() => router.push('/pet-sitter-availability')}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.setAvailabilityButtonText}>Set Availability</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Profile Popup Modal */}
      <ProfilePopupModal
        visible={profilePopupVisible}
        onClose={handleCloseProfile}
        profileData={selectedProfile}
        userRole="pet_sitter"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  chatContainer: {
    flex: 1,
  },
  chatContent: {
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
    marginBottom: 20,
  },
  setAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  setAvailabilityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  placeholderAvatar: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default PetSitterMessagesScreen; 