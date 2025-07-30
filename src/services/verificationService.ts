
export interface VerificationDocument {
  id: string;
  type: 'identity' | 'background_check' | 'certification' | 'insurance' | 'references';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  documentUrl?: string;
  notes?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  earnedAt?: string;
  isActive: boolean;
}

export interface SitterVerification {
  sitterId: string;
  documents: VerificationDocument[];
  badges: Badge[];
  verificationScore: number; // 0-100
  isVerified: boolean;
  verificationDate?: string;
  nextReviewDate?: string;
}

export interface VerificationCriteria {
  identityVerified: boolean;
  backgroundCheckPassed: boolean;
  hasCertification: boolean;
  hasInsurance: boolean;
  hasReferences: boolean;
  minimumBookings: number;
  minimumRating: number;
  responseTime: number; // in hours
}

class VerificationService {
  private static instance: VerificationService;
  private verifications: Map<string, SitterVerification> = new Map();

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  // Available badges
  private availableBadges: Badge[] = [
    {
      id: 'verified_sitter',
      name: 'Verified Sitter',
      description: 'Identity and background verified',
      icon: 'shield-checkmark',
      color: '#10B981',
      criteria: 'Identity verification and background check completed',
      isActive: true,
    },
    {
      id: 'super_sitter',
      name: 'Super Sitter',
      description: 'Consistently excellent service',
      icon: 'star',
      color: '#F59E0B',
      criteria: '4.8+ rating with 50+ bookings',
      isActive: true,
    },
    {
      id: 'quick_response',
      name: 'Quick Responder',
      description: 'Responds within 2 hours',
      icon: 'flash',
      color: '#3B82F6',
      criteria: 'Average response time under 2 hours',
      isActive: true,
    },
    {
      id: 'certified_trainer',
      name: 'Certified Trainer',
      description: 'Professional training certification',
      icon: 'school',
      color: '#8B5CF6',
      criteria: 'Professional pet training certification',
      isActive: true,
    },
    {
      id: 'emergency_care',
      name: 'Emergency Care',
      description: 'First aid and emergency care certified',
      icon: 'medical',
      color: '#EF4444',
      criteria: 'Pet first aid and emergency care certification',
      isActive: true,
    },
    {
      id: 'senior_specialist',
      name: 'Senior Specialist',
      description: 'Specialized in senior pet care',
      icon: 'heart',
      color: '#EC4899',
      criteria: '20+ bookings with senior pets',
      isActive: true,
    },
    {
      id: 'puppy_expert',
      name: 'Puppy Expert',
      description: 'Specialized in puppy care and training',
      icon: 'paw',
      color: '#06B6D4',
      criteria: '30+ puppy bookings with 4.5+ rating',
      isActive: true,
    },
    {
      id: 'cat_whisperer',
      name: 'Cat Whisperer',
      description: 'Expert in feline care',
      icon: 'home',
      color: '#84CC16',
      criteria: '40+ cat bookings with 4.7+ rating',
      isActive: true,
    },
  ];

  async getSitterVerification(sitterId: string): Promise<SitterVerification | null> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.verifications.get(sitterId) || null;
  }

  async submitVerificationDocument(
    sitterId: string, 
    documentType: VerificationDocument['type'],
    documentUrl?: string
  ): Promise<VerificationDocument> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const document: VerificationDocument = {
      id: Date.now().toString(),
      type: documentType,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      documentUrl,
    };

    let verification = this.verifications.get(sitterId);
    if (!verification) {
      verification = {
        sitterId,
        documents: [],
        badges: [],
        verificationScore: 0,
        isVerified: false,
      };
      this.verifications.set(sitterId, verification);
    }

    verification.documents.push(document);
    this.updateVerificationScore(sitterId);

    return document;
  }

  async reviewDocument(
    sitterId: string,
    documentId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const verification = this.verifications.get(sitterId);
    if (!verification) return;

    const document = verification.documents.find(doc => doc.id === documentId);
    if (document) {
      document.status = status;
      document.reviewedAt = new Date().toISOString();
      document.notes = notes;
    }

    this.updateVerificationScore(sitterId);
    this.checkAndAwardBadges(sitterId);
  }

  async getAvailableBadges(): Promise<Badge[]> {
    return this.availableBadges;
  }

  async checkAndAwardBadges(sitterId: string): Promise<Badge[]> {
    const verification = this.verifications.get(sitterId);
    if (!verification) return [];

    const newBadges: Badge[] = [];

    // Check for Verified Sitter badge
    const identityDoc = verification.documents.find(doc => doc.type === 'identity' && doc.status === 'approved');
    const backgroundDoc = verification.documents.find(doc => doc.type === 'background_check' && doc.status === 'approved');
    
    if (identityDoc && backgroundDoc && !verification.badges.find(b => b.id === 'verified_sitter')) {
      const badge = { ...this.availableBadges.find(b => b.id === 'verified_sitter')! };
      badge.earnedAt = new Date().toISOString();
      verification.badges.push(badge);
      newBadges.push(badge);
    }

    // Check for Certified Trainer badge
    const certificationDoc = verification.documents.find(doc => doc.type === 'certification' && doc.status === 'approved');
    if (certificationDoc && !verification.badges.find(b => b.id === 'certified_trainer')) {
      const badge = { ...this.availableBadges.find(b => b.id === 'certified_trainer')! };
      badge.earnedAt = new Date().toISOString();
      verification.badges.push(badge);
      newBadges.push(badge);
    }

    // Check for Emergency Care badge
    const emergencyDoc = verification.documents.find(doc => doc.type === 'certification' && doc.status === 'approved');
    if (emergencyDoc && !verification.badges.find(b => b.id === 'emergency_care')) {
      const badge = { ...this.availableBadges.find(b => b.id === 'emergency_care')! };
      badge.earnedAt = new Date().toISOString();
      verification.badges.push(badge);
      newBadges.push(badge);
    }

    return newBadges;
  }

  private updateVerificationScore(sitterId: string): void {
    const verification = this.verifications.get(sitterId);
    if (!verification) return;

    let score = 0;
    const totalDocuments = 5; // identity, background, certification, insurance, references

    // Calculate score based on approved documents
    const approvedDocuments = verification.documents.filter(doc => doc.status === 'approved').length;
    score = Math.round((approvedDocuments / totalDocuments) * 100);

    verification.verificationScore = score;
    verification.isVerified = score >= 80; // 80% threshold for verification

    if (verification.isVerified && !verification.verificationDate) {
      verification.verificationDate = new Date().toISOString();
      verification.nextReviewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
    }
  }

  async getVerificationStatus(sitterId: string): Promise<{
    isVerified: boolean;
    score: number;
    pendingDocuments: string[];
    nextSteps: string[];
  }> {
    const verification = await this.getSitterVerification(sitterId);
    
    if (!verification) {
      return {
        isVerified: false,
        score: 0,
        pendingDocuments: ['Identity Verification', 'Background Check', 'Certification', 'Insurance', 'References'],
        nextSteps: ['Submit identity documents', 'Complete background check', 'Upload certifications'],
      };
    }

    const pendingDocuments = verification.documents
      .filter(doc => doc.status === 'pending')
      .map(doc => this.getDocumentDisplayName(doc.type));

    const nextSteps = this.getNextSteps(verification);

    return {
      isVerified: verification.isVerified,
      score: verification.verificationScore,
      pendingDocuments,
      nextSteps,
    };
  }

  private getDocumentDisplayName(type: VerificationDocument['type']): string {
    switch (type) {
      case 'identity': return 'Identity Verification';
      case 'background_check': return 'Background Check';
      case 'certification': return 'Certification';
      case 'insurance': return 'Insurance';
      case 'references': return 'References';
      default: return 'Document';
    }
  }

  private getNextSteps(verification: SitterVerification): string[] {
    const steps: string[] = [];
    
    if (!verification.documents.find(doc => doc.type === 'identity' && doc.status === 'approved')) {
      steps.push('Submit government-issued ID for identity verification');
    }
    
    if (!verification.documents.find(doc => doc.type === 'background_check' && doc.status === 'approved')) {
      steps.push('Complete background check authorization');
    }
    
    if (!verification.documents.find(doc => doc.type === 'certification' && doc.status === 'approved')) {
      steps.push('Upload pet care certifications or training documents');
    }
    
    if (!verification.documents.find(doc => doc.type === 'insurance' && doc.status === 'approved')) {
      steps.push('Provide pet sitting insurance documentation');
    }
    
    if (!verification.documents.find(doc => doc.type === 'references' && doc.status === 'approved')) {
      steps.push('Submit professional references');
    }

    return steps;
  }

  // API method to get verification status from backend
  async getVerificationStatus(): Promise<{
    success: boolean;
    verification?: {
      id: string;
      status: string;
      document_type: string;
      document_number?: string;
      document_image?: string;
      is_philippine_id: boolean;
      submitted_at?: string;
      verified_at?: string;
      rejection_reason?: string;
      notes?: string;
    };
    badges: Badge[];
    message?: string;
  }> {
    try {
      // In a real implementation, this would call your backend API
      const response = await fetch('/api/verification/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      // Return mock data for development
      return {
        success: true,
        verification: null,
        badges: [],
        message: 'No verification submitted yet.'
      };
    }
  }

  // API method to submit verification
  async submitVerification(verificationData: {
    document_type: string;
    document_number?: string;
    document_image: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('document_type', verificationData.document_type);
      if (verificationData.document_number) {
        formData.append('document_number', verificationData.document_number);
      }
      // Handle image upload
      if (verificationData.document_image) {
        const response = await fetch(verificationData.document_image);
        const blob = await response.blob();
        formData.append('document_image', blob, 'verification.jpg');
      }

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit verification');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    }
  }

  private getAuthToken(): string {
    // In a real implementation, get token from secure storage
    // For now, return a placeholder
    return 'your-auth-token';
  }
}

export default VerificationService.getInstance(); 