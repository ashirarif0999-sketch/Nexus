import { Message, ChatConversation } from '../types';

const DB_NAME = 'NexusoMessages';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

class MessagesDB {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open messages DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('senderId', 'senderId', { unique: false });
          store.createIndex('receiverId', 'receiverId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('conversation', 'conversation', { unique: false });
        }
      };
    });
  }

  async getAllMessages(): Promise<Message[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    const messages = await this.getAllMessages();
    return messages
      .filter(m => !m.isDeleted && (
        (m.senderId === user1Id && m.receiverId === user2Id) ||
        (m.senderId === user2Id && m.receiverId === user1Id)
      ))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async saveMessage(message: Message): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateMessage(message: Message): Promise<void> {
    return this.saveMessage(message);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(messageId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getConversationsForUser(userId: string): Promise<string[]> {
    const messages = await this.getAllMessages();
    const partners = new Set<string>();
    
    messages.forEach(message => {
      if (message.senderId === userId) {
        partners.add(message.receiverId);
      }
      if (message.receiverId === userId) {
        partners.add(message.senderId);
      }
    });

    return Array.from(partners);
  }
  async markMessagesAsRead(user1Id: string, user2Id: string): Promise<void> {
    const messages = await this.getAllMessages();
    const db = await this.openDB();
    
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    for (const message of messages) {
      if (!message.isRead && (
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )) {
        store.put({ ...message, isRead: true });
      }
    }
  }
}

export const messagesDB = new MessagesDB();

// Helper to generate conversation ID
const getConversationId = (user1Id: string, user2Id: string): string => {
  return [user1Id, user2Id].sort().join('-');
};

// Get messages between two users (from both localStorage and IndexedDB)
export const getMessagesBetweenUsersCustom = async (user1Id: string, user2Id: string): Promise<Message[]> => {
  // Try IndexedDB first for custom accounts
  try {
    const idbMessages = await messagesDB.getMessagesBetweenUsers(user1Id, user2Id);
    if (idbMessages.length > 0) {
      return idbMessages;
    }
  } catch (error) {
    console.warn('Error reading from IndexedDB:', error);
  }
  
  // Fall back to localStorage for demo accounts
  const { getMessagesBetweenUsers } = await import('./messageStorage');
  return getMessagesBetweenUsers(user1Id, user2Id);
};

// Send a message (stores in IndexedDB for custom accounts)
export const sendMessageCustom = async (newMessage: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'reactions' | 'isStarred' | 'isDeleted'>): Promise<Message> => {
  // Check if either sender or receiver is a custom account (has timestamp-like ID or starts with uuid pattern)
  const isCustomAccount = newMessage.senderId.includes('-') || newMessage.receiverId.includes('-');
  
  const message: Message = {
    ...newMessage,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
    reactions: [],
    isStarred: false,
    isDeleted: false
  };

  // For custom accounts, use IndexedDB
  if (isCustomAccount) {
    await messagesDB.saveMessage(message);
  } else {
    // For demo accounts, use localStorage
    const { sendMessage: sendMessageLocal } = await import('./messageStorage');
    return sendMessageLocal(newMessage);
  }

  return message;
};

// Get conversations for a user (from both sources)
export const getConversationsForUserCustom = async (userId: string): Promise<ChatConversation[]> => {
  // Get conversations from IndexedDB
  let partnerIds: string[] = [];
  try {
    partnerIds = await messagesDB.getConversationsForUser(userId);
  } catch (error) {
    console.warn('Error getting conversations from IndexedDB:', error);
  }

  // If no conversations in IndexedDB, check localStorage
  if (partnerIds.length === 0) {
    const { getConversationsForUser } = await import('./messageStorage');
    return getConversationsForUser(userId);
  }

  // Convert partner IDs to ChatConversation objects
  const conversations: ChatConversation[] = [];
  for (const partnerId of partnerIds) {
    const messages = await messagesDB.getMessagesBetweenUsers(userId, partnerId);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
    conversations.push({
      id: getConversationId(userId, partnerId),
      participants: [userId, partnerId],
      lastMessage,
      updatedAt: lastMessage?.timestamp || new Date().toISOString(),
    });
  }

  return conversations.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// Mark messages as read
export const markMessagesAsReadCustom = async (userId: string, partnerId: string): Promise<void> => {
  try {
    await messagesDB.markMessagesAsRead(userId, partnerId);
  } catch (error) {
    console.warn('Error marking messages as read:', error);
  }
};