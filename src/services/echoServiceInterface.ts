// Common interface for Echo services
export interface EchoServiceInterface {
  setAuthToken(token: string): void;
  connect(): Promise<boolean>;
  disconnect(): void;
  initialize(): Promise<boolean>;
  getEcho(): any;
  listenToVerificationUpdates(userId: string, callback: (data: any) => void): any;
  stopListeningToVerificationUpdates(userId: string): void;
  listenToUserNotifications(userId: string, callback: (data: any) => void): any;
  stopListeningToUserNotifications(userId: string): void;
  listenToAdminNotifications(callback: (data: any) => void): any;
  stopListeningToAdminNotifications(): void;
}
