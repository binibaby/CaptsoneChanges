import { makeApiCall } from './networkService';

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  method: string;
  app_share: number;
  sitter_share: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_id: string;
  processed_at?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  user_id: number;
  type: 'credit' | 'debit';
  amount: number;
  bank_name?: string;
  account_number?: string;
  status: 'completed' | 'processing' | 'failed';
  reference_number: string;
  processed_at?: string;
  notes: string;
  created_at: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export interface Bank {
  code: string;
  name: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  payment: Payment;
  invoice_url: string;
  invoice_id: string;
}

export interface PaymentStatusResponse {
  payment: Payment;
  invoice_status: string;
  invoice_url?: string;
}

export interface CashOutRequest {
  amount: number;
  bank_code: string;
  account_holder_name: string;
  account_number: string;
}

export interface CashOutResponse {
  success: boolean;
  message: string;
}

class PaymentService {
  /**
   * Create a payment invoice for a booking
   */
  async createInvoice(bookingId: number): Promise<CreateInvoiceResponse> {
    try {
      const response = await makeApiCall('/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment invoice:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
    try {
      const response = await makeApiCall(`/payments/${paymentId}/status`, {
        method: 'GET',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment history for the current user
   */
  async getPaymentHistory(): Promise<Payment[]> {
    try {
      const response = await makeApiCall('/payments/history', {
        method: 'GET',
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Get wallet information
   */
  async getWallet(): Promise<WalletData> {
    try {
      const response = await makeApiCall('/wallet', {
        method: 'GET',
      });

      const data = await response.json();
      return {
        balance: data.balance || 0,
        transactions: data.transactions || [],
      };
    } catch (error) {
      console.error('Error getting wallet data:', error);
      throw error;
    }
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(): Promise<WalletTransaction[]> {
    try {
      const response = await makeApiCall('/wallet/transactions', {
        method: 'GET',
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      throw error;
    }
  }

  /**
   * Cash out from wallet
   */
  async cashOut(request: CashOutRequest): Promise<CashOutResponse> {
    try {
      const response = await makeApiCall('/wallet/cash-out', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing cash out:', error);
      throw error;
    }
  }

  /**
   * Get available banks for cash out
   */
  async getAvailableBanks(): Promise<Bank[]> {
    try {
      const response = await makeApiCall('/wallet/banks', {
        method: 'GET',
      });

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error getting available banks:', error);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  /**
   * Calculate app fee (10%)
   */
  calculateAppFee(amount: number): number {
    return amount * 0.1;
  }

  /**
   * Calculate sitter share (90%)
   */
  calculateSitterShare(amount: number): number {
    return amount * 0.9;
  }

  /**
   * Validate cash out amount
   */
  validateCashOutAmount(amount: number, balance: number): { valid: boolean; error?: string } {
    if (amount < 100) {
      return { valid: false, error: 'Minimum cash out amount is ₱100' };
    }
    if (amount > 50000) {
      return { valid: false, error: 'Maximum cash out amount is ₱50,000' };
    }
    if (amount > balance) {
      return { valid: false, error: 'Insufficient wallet balance' };
    }
    return { valid: true };
  }

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  /**
   * Get transaction type color
   */
  getTransactionTypeColor(type: string): string {
    return type === 'credit' ? '#10B981' : '#EF4444';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const paymentService = new PaymentService();
