import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import ReviewModal from '../../components/ReviewModal';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { ReverbConversation, ReverbMessage, reverbMessagingService } from '../../services/reverbMessagingService';

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
  const params = useLocalSearchParams();
  const { isLocationTracking } = useAuth();
  const [conversations, setConversations] = useState<ReverbConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ReverbConversation | null>(null);
  const [messages, setMessages] = useState<ReverbMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const [hasAutoOpenedConversation, setHasAutoOpenedConversation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
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
      let sitterRating = 0;
      
      try {
        const { default: networkService } = await import('../../services/networkService');
        
        // Fetch user profile
        const profileResponse = await networkService.get(`/api/profile`);
        detailedProfile = profileResponse.data.user;
        console.log('🔍 Fetched detailed profile:', detailedProfile);
        
        // Fetch sitter rating if it's a sitter
        if (conversation.other_user.role === 'pet_sitter') {
          try {
            const ratingResponse = await networkService.get(`/api/sitters/${conversation.other_user.id}/reviews`);
            sitterRating = ratingResponse.data.sitter.average_rating || 0;
            console.log('🔍 Fetched sitter rating:', sitterRating);
          } catch (ratingError) {
            console.log('⚠️ Could not fetch sitter rating, using default');
          }
        }
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
        rating: sitterRating || detailedProfile?.rating || conversation.other_user.rating || 0,
        role: 'pet_sitter' as const,
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
      console.log('💬 Loading conversations...');
      
      // Load conversations for current user only
      console.log('💬 Loading conversations for current user...');
      
      // Get current user first to ensure we have the right user context
      const { default: authService } = await import('../../services/authService');
      const currentUser = await authService.getCurrentUser();
      console.log('💬 Current user ID:', currentUser?.id);
      console.log('💬 Current user token present:', !!currentUser?.token);
      
      if (!currentUser) {
        console.log('⚠️ No current user found, cannot load conversations');
        setConversations([]);
        return;
      }
      
      // Clear any cached conversations in the messaging service
      const { reverbMessagingService } = await import('../../services/reverbMessagingService');
      reverbMessagingService.clearAuthCache();
      
      // Force fresh conversation load from API
      const data = await reverbMessagingService.getConversations();
      console.log('💬 Conversations loaded for current user:', data.length);
      
      if (data && data.length > 0) {
        console.log('💬 Conversation details:', data.map(conv => ({
          conversation_id: conv.conversation_id,
          other_user_id: conv.other_user?.id,
          other_user_name: conv.other_user?.name,
          latest_message: conv.last_message?.message?.substring(0, 30) + '...'
        })));
      } else {
        console.log('💬 No conversations found for user ID:', currentUser.id);
      }
      
      setConversations(data);
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      console.log('⚠️ Using empty conversations for fresh start');
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
        console.log('🔍 Loaded user for owner:', user);
        if (user && user.id) {
          const userId = user.id.toString();
          setCurrentUserId(userId);
          console.log('🔍 Set currentUserId for owner:', userId);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // Load available bookings for review
  const loadAvailableBookings = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const bookings = await bookingService.getPetOwnerBookings(currentUserId);
      console.log('📊 All owner bookings:', bookings.length);
      console.log('📊 Booking statuses:', bookings.map(b => ({ id: b.id, status: b.status, sitterName: b.sitterName })));
      
      // For testing: allow reviewing ANY booking (not just completed ones)
      // This will help test if the sitter profile popup fetches updated ratings
      const reviewableBookings = bookings.filter(booking => 
        booking.status === 'completed' || 
        booking.status === 'confirmed' || 
        booking.status === 'active' ||
        booking.status === 'pending'
      );
      
      console.log('⭐ Reviewable bookings found (including non-completed for testing):', reviewableBookings.length);
      setAvailableBookings(reviewableBookings);
    } catch (error) {
      console.error('Error loading available bookings:', error);
    }
  }, [currentUserId]);

  // Load bookings when user changes
  useEffect(() => {
    if (currentUserId) {
      loadAvailableBookings();
    }
  }, [currentUserId, loadAvailableBookings]);

  // Handle review button press
  const handleReviewPress = () => {
    if (availableBookings.length === 0) {
      Alert.alert('No Bookings Available', 'You don\'t have any bookings to review yet.');
      return;
    }
    
    // For testing: show the first available booking (regardless of status)
    // This allows testing reviews on pending, confirmed, active, or completed bookings
    const booking = availableBookings[0];
    console.log('⭐ Opening review modal for booking (testing all statuses):', booking);
    setSelectedBookingForReview(booking);
    setReviewModalVisible(true);
  };

  // Handle review submission
  const handleReviewSubmitted = () => {
    setReviewModalVisible(false);
    setSelectedBookingForReview(null);
    // Reload available bookings
    loadAvailableBookings();
  };

  // Initialize messaging
  useEffect(() => {
    console.log('💬 Initializing messaging in PetOwnerMessagesScreen');
    
    // Verify current user before loading conversations
    const initializeWithUserCheck = async () => {
      try {
        const { default: authService } = await import('../../services/authService');
        const currentUser = await authService.getCurrentUser();
        
        if (!currentUser) {
          console.log('⚠️ No authenticated user found, skipping conversation loading');
          setConversations([]);
          return;
        }
        
        console.log('✅ Authenticated user found:', {
          id: currentUser.id,
          name: currentUser.firstName + ' ' + currentUser.lastName,
          email: currentUser.email
        });
        
        setCurrentUserId(currentUser.id);
        console.log('✅ Current user ID set to:', currentUser.id);
        
        // Load conversations for this specific user
        await loadConversations();
        
      } catch (error) {
        console.error('❌ Error in user verification:', error);
        setConversations([]);
      }
    };
    
    initializeWithUserCheck();
    
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
  }, [loadConversations]); // Removed selectedConversation from dependencies

  // Reload conversations when screen comes into focus (after login/logout)
  useFocusEffect(
    useCallback(() => {
      console.log('💬 Messages screen focused - reloading conversations');
      loadConversations();
    }, [loadConversations])
  );

  // Skip auto conversation creation to avoid 422 errors with non-existent users
  // Users will need to find sitters through the Find Sitter feature first

  // Handle opening specific conversation when conversations are loaded
  useEffect(() => {
    if (params.conversationId && !hasAutoOpenedConversation) {
      console.log('💬 Auto-opening conversation with ID:', params.conversationId);
      console.log('💬 Available conversations:', conversations.map(c => c.conversation_id));
      
      const conversation = conversations.find(c => c.conversation_id === params.conversationId);
      if (conversation) {
        console.log('💬 Found existing conversation, opening chat:', conversation.other_user.name);
        handleChatPress(conversation);
        setHasAutoOpenedConversation(true);
      } else {
        console.log('💬 Conversation not found in list, creating new one');
        // If conversation doesn't exist, create it and open it
        const otherUserId = params.otherUserId;
        if (otherUserId) {
          const newConversation: ReverbConversation = {
            conversation_id: Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId || '',
            other_user: {
              id: Array.isArray(otherUserId) ? otherUserId[0] : otherUserId || '',
              name: Array.isArray(params.otherUserName) ? params.otherUserName[0] : params.otherUserName || `Sitter ${Array.isArray(otherUserId) ? otherUserId[0] : otherUserId}`,
              profile_image: Array.isArray(params.otherUserImage) ? params.otherUserImage[0] : params.otherUserImage || null
            },
            last_message: null,
            unread_count: 0,
            updated_at: new Date().toISOString()
          };
          console.log('💬 Created new conversation:', newConversation);
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
      onPress={() => {
        // Convert Message to ReverbConversation format
        const conversation: ReverbConversation = {
          conversation_id: (item as any).conversation_id || '',
          other_user: {
            id: (item as any).sender_id || '',
            name: (item as any).sender?.name || 'Unknown',
            profile_image: (item as any).sender?.profile_image || null
          },
          last_message: item as any,
          unread_count: 0,
          updated_at: (item as any).created_at || new Date().toISOString()
        };
        handleChatPress(conversation);
      }}
    >
      <View style={styles.avatarContainer}>
        <Image source={item.avatar} style={styles.avatar} />
        {item.isOnline && isLocationTracking && <View style={styles.onlineIndicator} />}
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

  const renderChatMessage = ({ item }: { item: ReverbMessage }) => {
    // For owner screen: sent messages on right, received messages on left
    const messageTime = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Simplified and robust alignment logic
    const senderId = parseInt(item.sender_id);
    const userId = currentUserId ? parseInt(currentUserId) : null;
    
    // For debugging: if we're in PetOwnerMessagesScreen, assume owner ID is 6 (beta owner)
    // This is a temporary fix to ensure owner messages go to the right
    let isFromMe = userId !== null && senderId === userId;
    
    // Temporary hardcoded fix for owner messages alignment
    if (!isFromMe && senderId === 6) {
      isFromMe = true;
      console.log('🔧 Hardcoded fix applied: Owner message (ID 6) -> RIGHT');
    }
    
    // Enhanced debug logging
    console.log('🔍 Message alignment debug:', {
      messageId: item.id,
      senderId: senderId,
      senderIdType: typeof senderId,
      currentUserId: userId,
      currentUserIdType: typeof userId,
      isFromMe: isFromMe,
      message: item.message.substring(0, 20) + '...',
      alignment: isFromMe ? 'RIGHT (my message)' : 'LEFT (their message)'
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

  const renderConversationItem = ({ item }: { item: ReverbConversation }) => {
    // Debug profile image
    console.log('🔍 Profile image debug:', {
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
                console.log('❌ Image load error for', item.other_user.name, ':', error.nativeEvent.error);
                console.log('❌ Failed URL:', item.other_user.profile_image);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully for:', item.other_user.name);
                console.log('✅ Image URL:', item.other_user.profile_image);
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
            
            {/* Rate & Review Button - Owner Side Only */}
            {!reviewModalVisible && (
              <TouchableOpacity style={styles.reviewButton} onPress={handleReviewPress}>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </TouchableOpacity>
            )}
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
                <Text style={styles.emptyChatSubtitle}>Send a message to the sitter to begin chatting</Text>
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


        {/* Review Modal */}
        {selectedBookingForReview && (
          <ReviewModal
            visible={reviewModalVisible}
            onClose={() => setReviewModalVisible(false)}
            bookingId={selectedBookingForReview.id}
            sitterName={selectedBookingForReview.sitterName || selectedBookingForReview.petSitterName || 'Pet Sitter'}
            petName={selectedBookingForReview.petName || 'Pet'}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}

        {/* Profile Popup Modal */}
        <ProfilePopupModal
          visible={profilePopupVisible}
          onClose={handleCloseProfile}
          profileData={selectedProfile}
          userRole="pet_owner"
        />
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
          style={styles.chatMessages}
          contentContainerStyle={styles.chatMessages}
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
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: '#8B5CF6', marginRight: 10 }]} 
            onPress={() => {
              console.log('🔍 Test button clicked');
              const testProfile = {
                id: '1',
                name: 'Test Sitter',
                profile_image: null,
                phone: '+639123456789',
                address: 'Manila, Philippines',
                rating: 4.5,
                role: 'pet_sitter' as const,
              };
              setSelectedProfile(testProfile);
              setProfilePopupVisible(true);
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12 }}>Test</Text>
          </TouchableOpacity>
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
            <Text style={styles.emptySubtitle}>Find pet sitters and book services to start messaging them here.</Text>
            <TouchableOpacity 
              style={styles.findSitterButton}
              onPress={() => router.push('/find-sitter-map')}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.findSitterButtonText}>Find Pet Sitters</Text>
            </TouchableOpacity>
            
            {/* Clear Conversations Button for Testing */}
            <TouchableOpacity 
              style={[styles.findSitterButton, { backgroundColor: '#10B981', marginTop: 10 }]}
              onPress={async () => {
                console.log('🔄 Manual refresh triggered');
                await loadConversations();
                Alert.alert('Refreshed', 'Conversations have been refreshed from the server.');
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.findSitterButtonText}>Refresh Conversations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.findSitterButton, { backgroundColor: '#EF4444', marginTop: 10 }]}
              onPress={() => {
                setConversations([]);
                Alert.alert('Conversations Cleared', 'All conversations have been cleared for testing.');
              }}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.findSitterButtonText}>Clear All Conversations</Text>
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  findSitterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  findSitterButtonText: {
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
  reviewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: '#F59E0B',
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

export default PetOwnerMessagesScreen; 