const API_BASE_URL = 'http://your-backend-url.com/api'; // Replace with your actual backend URL

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  is_read: boolean;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface CreateTicketData {
  subject?: string;
  description?: string;
  category?: 'general' | 'billing' | 'technical' | 'booking' | 'other';
  priority?: 'low' | 'medium' | 'high';
}

class SupportService {
  private getAuthToken(): string | null {
    // In a real implementation, this would get the token from secure storage
    // For now, return a placeholder
    return localStorage.getItem('auth_token');
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: CreateTicketData = {}): Promise<{
    success: boolean;
    ticket: SupportTicket;
    message: string;
  }> {
    return this.apiCall('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: ticketData.subject || 'Chat Support',
        description: ticketData.description || 'Support chat conversation',
        category: ticketData.category || 'general',
        priority: ticketData.priority || 'medium',
      }),
    });
  }

  /**
   * Get all support tickets for the current user
   */
  async getTickets(): Promise<{
    success: boolean;
    tickets: SupportTicket[];
  }> {
    return this.apiCall('/support/tickets');
  }

  /**
   * Get active chat sessions
   */
  async getActiveChats(): Promise<{
    success: boolean;
    chats: SupportTicket[];
  }> {
    return this.apiCall('/support/chats/active');
  }

  /**
   * Get messages for a specific ticket
   */
  async getMessages(ticketId: string): Promise<{
    success: boolean;
    ticket: SupportTicket;
    messages: SupportMessage[];
  }> {
    return this.apiCall(`/support/tickets/${ticketId}/messages`);
  }

  /**
   * Send a message to a support ticket
   */
  async sendMessage(ticketId: string, message: string): Promise<{
    success: boolean;
    message: SupportMessage;
    ticket: SupportTicket;
  }> {
    return this.apiCall(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  /**
   * Close a support ticket
   */
  async closeTicket(ticketId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.apiCall(`/support/tickets/${ticketId}/close`, {
      method: 'PATCH',
    });
  }

  /**
   * Start a new support chat session
   */
  async startSupportChat(): Promise<{
    success: boolean;
    ticket: SupportTicket;
    messages: SupportMessage[];
  }> {
    try {
      // First, check if there's an active chat
      const activeChatsResponse = await this.getActiveChats();
      
      if (activeChatsResponse.success && activeChatsResponse.chats.length > 0) {
        // Return the most recent active chat
        const activeChat = activeChatsResponse.chats[0];
        const messagesResponse = await this.getMessages(activeChat.id);
        
        return {
          success: true,
          ticket: activeChat,
          messages: messagesResponse.messages || [],
        };
      }

      // Create a new ticket if no active chat exists
      const ticketResponse = await this.createTicket({
        subject: 'Support Chat',
        description: 'Live chat support session',
        category: 'general',
        priority: 'medium',
      });

      if (ticketResponse.success) {
        return {
          success: true,
          ticket: ticketResponse.ticket,
          messages: [],
        };
      }

      throw new Error('Failed to create support ticket');
    } catch (error) {
      console.error('Failed to start support chat:', error);
      throw error;
    }
  }
}

export const supportService = new SupportService();
export type { CreateTicketData, SupportMessage, SupportTicket };
