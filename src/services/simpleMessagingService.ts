// Simple Messaging Service - Working version without errors
// This service provides basic messaging functionality without API calls

export interface SimpleMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export interface SimpleConversation {
  conversation_id: string;
  other_user: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  last_message: SimpleMessage | null;
  unread_count: number;
  updated_at: string;
}

class SimpleMessagingService {
  private static instance: SimpleMessagingService;
  private conversations: Map<string, SimpleConversation> = new Map();
  private messages: Map<string, SimpleMessage[]> = new Map();
  private messageIdCounter = 1;

  static getInstance(): SimpleMessagingService {
    if (!SimpleMessagingService.instance) {
      console.log('🔄 Creating new SimpleMessagingService instance');
      SimpleMessagingService.instance = new SimpleMessagingService();
    } else {
      console.log('♻️ Returning existing SimpleMessagingService instance');
    }
    return SimpleMessagingService.instance;
  }

  private constructor() {
    console.log('✅ SimpleMessagingService initialized - NEW INSTANCE CREATED');
    console.log('✅ Instance ID:', Math.random().toString(36).substr(2, 9));
    this.initializeMockData();
  }

  private initializeMockData() {
    // Start with empty conversations - no default data
    // Conversations will be created when users start messaging
  }

  private generateConversationId(userId1: string, userId2: string): string {
    // Always generate the same ID regardless of parameter order
    // This ensures both owner and sitter use the same conversation ID
    const ids = [userId1, userId2].sort();
    const conversationId = ids.join('_');
    console.log('📱 Generated conversation ID:', conversationId, 'from:', userId1, 'and', userId2);
    return conversationId;
  }

  public async getConversations(): Promise<SimpleConversation[]> {
    console.log('📱 Getting conversations (mock data)');
    console.log('📱 Available conversations:', Array.from(this.conversations.keys()));
    const conversations = Array.from(this.conversations.values()).sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    console.log('📱 Returning', conversations.length, 'conversations');
    return conversations;
  }

  public async getMessages(conversationId: string): Promise<SimpleMessage[]> {
    console.log('📱 Getting messages for conversation:', conversationId);
    console.log('📱 Available conversations:', Array.from(this.conversations.keys()));
    console.log('📱 Available message conversations:', Array.from(this.messages.keys()));
    
    if (!this.messages.has(conversationId)) {
      // Start with empty messages array - no default messages
      this.messages.set(conversationId, []);
      console.log('📱 Created new empty conversation for:', conversationId);
    }

    const messages = this.messages.get(conversationId) || [];
    console.log('📱 Returning', messages.length, 'messages for conversation:', conversationId);
    return messages;
  }

  public async sendMessage(receiverId: string, message: string, type: string = 'text'): Promise<SimpleMessage> {
    console.log('📱 Owner sending message to sitter:', receiverId, 'Message:', message);
    
    // Use a consistent conversation ID that both users will share
    const conversationId = this.generateConversationId('owner', receiverId);
    const newMessage: SimpleMessage = {
      id: `msg_${Date.now()}_${this.messageIdCounter++}`,
      conversation_id: conversationId,
      sender_id: 'owner',
      receiver_id: receiverId,
      message: message,
      is_read: false,
      type: type,
      created_at: new Date().toISOString(),
      sender: {
        id: 'owner',
        name: 'Pet Owner',
        profile_image: null
      }
    };

    // Add message to conversation
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    
    // Check if message already exists to prevent duplicates
    const existingMessages = this.messages.get(conversationId)!;
    const messageExists = existingMessages.some(msg => msg.id === newMessage.id);
    if (!messageExists) {
      existingMessages.push(newMessage);
    }

    // Update conversation
    if (this.conversations.has(conversationId)) {
      const conv = this.conversations.get(conversationId)!;
      conv.last_message = newMessage;
      conv.updated_at = new Date().toISOString();
    } else {
      // If it's a new conversation, add it
      const otherUser = { id: receiverId, name: `Sitter ${receiverId}`, profile_image: null };
      this.conversations.set(conversationId, {
        conversation_id: conversationId,
        other_user: otherUser,
        last_message: newMessage,
        unread_count: 0,
        updated_at: newMessage.created_at,
      });
    }

    console.log('📱 Message stored in conversation:', conversationId);
    return newMessage;
  }

  public async startConversation(userId: string, userName?: string, userImage?: string): Promise<{ conversation_id: string; other_user: any }> {
    console.log('📱 Starting conversation with sitter:', userId, 'Name:', userName);
    
    // Use the same consistent conversation ID that both users will share
    const conversationId = this.generateConversationId('owner', userId);
    
    // Create conversation if it doesn't exist
    if (!this.conversations.has(conversationId)) {
      const newConversation: SimpleConversation = {
        conversation_id: conversationId,
        other_user: {
          id: userId,
          name: userName || `Sitter ${userId}`,
          profile_image: userImage || null
        },
        last_message: null,
        unread_count: 0,
        updated_at: new Date().toISOString()
      };
      this.conversations.set(conversationId, newConversation);
    }

    console.log('📱 Conversation created/retrieved with ID:', conversationId);
    return {
      conversation_id: conversationId,
      other_user: {
        id: userId,
        name: userName || `Sitter ${userId}`,
        profile_image: userImage || null
      }
    };
  }

  public async markAsRead(conversationId: string): Promise<void> {
    console.log('📱 Marking conversation as read:', conversationId);
    
    if (this.conversations.has(conversationId)) {
      const conv = this.conversations.get(conversationId)!;
      conv.unread_count = 0;
    }
  }

  public async getUnreadCount(): Promise<number> {
    console.log('📱 Getting unread count');
    let total = 0;
    this.conversations.forEach(conv => {
      total += conv.unread_count;
    });
    return total;
  }

  // Method for sitter to send messages back to owner
  public async sendMessageAsSitter(sitterId: string, message: string, type: string = 'text'): Promise<SimpleMessage> {
    console.log('📱 Sitter sending message to owner, sitter ID:', sitterId, 'Message:', message);
    
    // Use the same consistent conversation ID (owner_sitterId)
    const conversationId = this.generateConversationId('owner', sitterId);
    const newMessage: SimpleMessage = {
      id: `msg_${Date.now()}_${this.messageIdCounter++}`,
      conversation_id: conversationId,
      sender_id: 'sitter',
      receiver_id: 'owner',
      message: message,
      is_read: false,
      type: type,
      created_at: new Date().toISOString(),
      sender: {
        id: 'sitter',
        name: 'Pet Sitter',
        profile_image: null
      }
    };

    // Add message to conversation
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    
    // Check if message already exists to prevent duplicates
    const existingMessages = this.messages.get(conversationId)!;
    const messageExists = existingMessages.some(msg => msg.id === newMessage.id);
    if (!messageExists) {
      existingMessages.push(newMessage);
    }

    // Update conversation
    if (this.conversations.has(conversationId)) {
      const conv = this.conversations.get(conversationId)!;
      conv.last_message = newMessage;
      conv.updated_at = new Date().toISOString();
    } else {
      // If it's a new conversation, add it
      const otherUser = { id: sitterId, name: `Sitter ${sitterId}`, profile_image: null };
      this.conversations.set(conversationId, {
        conversation_id: conversationId,
        other_user: otherUser,
        last_message: newMessage,
        unread_count: 0,
        updated_at: newMessage.created_at,
      });
    }

    console.log('📱 Sitter message stored in conversation:', conversationId);
    return newMessage;
  }

  // Debug method to see all stored data
  public debugData() {
    console.log('🔍 DEBUG - Service instance data:');
    console.log('🔍 DEBUG - All conversations:', Array.from(this.conversations.keys()));
    console.log('🔍 DEBUG - All message conversations:', Array.from(this.messages.keys()));
    this.conversations.forEach((conv, id) => {
      console.log('🔍 DEBUG - Conversation', id, ':', conv.other_user.name);
    });
    this.messages.forEach((msgs, id) => {
      console.log('🔍 DEBUG - Messages in', id, ':', msgs.length, 'messages');
    });
  }
}

export const simpleMessagingService = SimpleMessagingService.getInstance();
export default simpleMessagingService;
