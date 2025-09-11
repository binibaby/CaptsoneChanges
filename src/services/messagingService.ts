import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'booking_confirmation' | 'booking_cancellation' | 'system';
  bookingId?: string;
  metadata?: any;
}

export interface Chat {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  isOnline: boolean;
  bookingId?: string;
}

class MessagingService {
  private static instance: MessagingService;
  private listeners: ((messages: Message[]) => void)[] = [];
  private chatListeners: ((chats: Chat[]) => void)[] = [];

  private constructor() {}

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  // Subscribe to message updates
  subscribe(listener: (messages: Message[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Subscribe to chat updates
  subscribeToChats(listener: (chats: Chat[]) => void) {
    this.chatListeners.push(listener);
    return () => {
      this.chatListeners = this.chatListeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(messages: Message[]) {
    this.listeners.forEach(listener => listener(messages));
  }

  private notifyChatListeners(chats: Chat[]) {
    this.chatListeners.forEach(listener => listener(chats));
  }

  // Get all messages
  async getMessages(): Promise<Message[]> {
    try {
      const stored = await AsyncStorage.getItem('messages');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Get all chats
  async getChats(): Promise<Chat[]> {
    try {
      const stored = await AsyncStorage.getItem('chats');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  // Save messages to storage
  private async saveMessages(messages: Message[]) {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(messages));
      this.notifyListeners(messages);
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }

  // Save chats to storage
  private async saveChats(chats: Chat[]) {
    try {
      await AsyncStorage.setItem('chats', JSON.stringify(chats));
      this.notifyChatListeners(chats);
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }

  // Send a message
  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'isRead'>): Promise<Message> {
    const messages = await this.getMessages();
    const newMessage: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    messages.push(newMessage);
    await this.saveMessages(messages);

    // Update chat
    await this.updateChat(newMessage);

    return newMessage;
  }

  // Create a message (alias for sendMessage for consistency)
  async createMessage(messageData: {
    senderId: string;
    receiverId: string;
    message: string;
    isBookingRelated?: boolean;
    bookingId?: string;
  }): Promise<Message> {
    // Get user names (you might want to get these from user service)
    const senderName = 'Current User'; // You might want to get this from auth service
    const receiverName = 'Other User'; // You might want to get this from user service

    return this.sendMessage({
      senderId: messageData.senderId,
      senderName: senderName,
      receiverId: messageData.receiverId,
      receiverName: receiverName,
      text: messageData.message,
      type: messageData.isBookingRelated ? 'booking_confirmation' : 'text',
      bookingId: messageData.bookingId,
    });
  }

  // Update chat with new message
  private async updateChat(message: Message) {
    const chats = await this.getChats();
    const chatId = this.getChatId(message.senderId, message.receiverId);
    
    const existingChatIndex = chats.findIndex(chat => chat.id === chatId);
    
    if (existingChatIndex >= 0) {
      // Update existing chat
      chats[existingChatIndex] = {
        ...chats[existingChatIndex],
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
        unreadCount: message.receiverId === chats[existingChatIndex].participantId ? 
          chats[existingChatIndex].unreadCount + 1 : 0,
      };
    } else {
      // Create new chat
      const newChat: Chat = {
        id: chatId,
        participantId: message.senderId,
        participantName: message.senderName,
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
        unreadCount: 0,
        isOnline: false,
        bookingId: message.bookingId,
      };
      chats.push(newChat);
    }

    await this.saveChats(chats);
  }

  // Get chat ID from two user IDs
  private getChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('-');
  }

  // Get messages between two users
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    const messages = await this.getMessages();
    return messages.filter(message => 
      (message.senderId === userId1 && message.receiverId === userId2) ||
      (message.senderId === userId2 && message.receiverId === userId1)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Mark messages as read
  async markMessagesAsRead(senderId: string, receiverId: string) {
    const messages = await this.getMessages();
    const updated = messages.map(message => 
      (message.senderId === senderId && message.receiverId === receiverId) ? 
        { ...message, isRead: true } : message
    );
    await this.saveMessages(updated);

    // Update chat unread count
    const chats = await this.getChats();
    const chatId = this.getChatId(senderId, receiverId);
    const updatedChats = chats.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    );
    await this.saveChats(updatedChats);
  }

  // Create booking confirmation message
  async createBookingConfirmationMessage(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'confirmed' | 'cancelled';
  }) {
    const statusText = bookingData.status === 'confirmed' ? 'confirmed' : 'cancelled';
    const emoji = bookingData.status === 'confirmed' ? '✅' : '❌';
    
    const messageText = `${emoji} Your booking for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime} has been ${statusText}. ${bookingData.status === 'confirmed' ? 'Let\'s discuss the details!' : 'Feel free to book another time.'}`;

    return this.sendMessage({
      senderId: bookingData.sitterId,
      senderName: bookingData.sitterName,
      receiverId: bookingData.petOwnerId,
      receiverName: bookingData.petOwnerName,
      text: messageText,
      type: bookingData.status === 'confirmed' ? 'booking_confirmation' : 'booking_cancellation',
      bookingId: bookingData.bookingId,
      metadata: {
        bookingDate: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: bookingData.status,
      }
    });
  }

  // Create booking request message
  async createBookingRequestMessage(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }) {
    const messageText = `Hi! I'd like to book your pet sitting services for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime} at ₱${bookingData.hourlyRate}/hour. Please let me know if you're available!`;

    return this.sendMessage({
      senderId: bookingData.petOwnerId,
      senderName: bookingData.petOwnerName,
      receiverId: bookingData.sitterId,
      receiverName: bookingData.sitterName,
      text: messageText,
      type: 'booking_confirmation',
      bookingId: bookingData.bookingId,
      metadata: {
        bookingDate: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        hourlyRate: bookingData.hourlyRate,
      }
    });
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const messages = await this.getMessages();
    return messages.filter(message => 
      message.receiverId === userId && !message.isRead
    ).length;
  }
}

export const messagingService = MessagingService.getInstance();
