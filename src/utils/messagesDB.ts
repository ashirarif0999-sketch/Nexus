import { Message, ChatConversation } from '../types';

const DB_NAME = 'NexusoMessages';
const DB_VERSION = 2; // Incremented for improved schema and error handling
const STORE_NAME = 'messages';
const CONVERSATIONS_STORE = 'conversations';
const METADATA_STORE = 'metadata';

// Performance and reliability constants
const MAX_STORAGE_WARNING = 50 * 1024 * 1024; // 50MB warning threshold
const MAX_TRANSACTION_RETRIES = 3;
const TRANSACTION_TIMEOUT = 5000; // 5 seconds
const BATCH_SIZE = 50; // Process messages in batches for performance

class MessagesDB {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        console.error('💡 This might be due to browser restrictions or storage quota exceeded');
        reject(new Error(`IndexedDB open failed: ${request.error?.message || 'Unknown error'}`));
      };

      request.onblocked = () => {
        console.warn('⚠️ IndexedDB open blocked - close other tabs with this app');
        reject(new Error('IndexedDB blocked - close other tabs'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully, version:', DB_VERSION);

        // Check storage usage
        this.checkStorageUsage();

        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        console.log('🔄 Upgrading IndexedDB schema to version:', DB_VERSION);
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Handle schema migration
        this.upgradeDatabase(db, oldVersion, DB_VERSION);
      };
    });
  }

  private upgradeDatabase(db: IDBDatabase, oldVersion: number, newVersion: number) {
    console.log(`Migrating from version ${oldVersion} to ${newVersion}`);

    // Create messages store if it doesn't exist
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const messagesStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      messagesStore.createIndex('senderId', 'senderId', { unique: false });
      messagesStore.createIndex('receiverId', 'receiverId', { unique: false });
      messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      messagesStore.createIndex('conversation', ['senderId', 'receiverId'], { unique: false });
      messagesStore.createIndex('isDeleted', 'isDeleted', { unique: false });
      console.log('📦 Created messages store with indexes');
    }

    // Create conversations store for faster conversation queries
    if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
      const convStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
      convStore.createIndex('participants', 'participants', { unique: false });
      convStore.createIndex('lastMessageTime', 'lastMessageTime', { unique: false });
      console.log('📦 Created conversations store');
    }

    // Create metadata store for app settings and stats
    if (!db.objectStoreNames.contains(METADATA_STORE)) {
      db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      console.log('📦 Created metadata store');
    }
  }

  private async checkStorageUsage() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usageMB = Math.round((estimate.usage || 0) / (1024 * 1024));
        const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));

        console.log(`💾 Storage usage: ${usageMB}MB / ${quotaMB}MB`);

        if ((estimate.usage || 0) > MAX_STORAGE_WARNING) {
          console.warn(`⚠️ Storage usage high: ${usageMB}MB. Consider cleanup.`);
        }
      }
    } catch (error) {
      console.warn('Could not check storage usage:', error);
    }
  }

  async getAllMessages(): Promise<Message[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');

      // Set transaction timeout
      const timeoutId = setTimeout(() => {
        transaction.abort();
        reject(new Error('Transaction timeout'));
      }, TRANSACTION_TIMEOUT);

      transaction.oncomplete = () => clearTimeout(timeoutId);
      transaction.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ Transaction failed:', transaction.error);
        reject(transaction.error);
      };

      try {
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => {
          console.error('❌ Failed to get all messages:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const messages = request.result || [];
          console.log(`📚 Retrieved ${messages.length} messages from IndexedDB`);
          resolve(messages);
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error in getAllMessages:', error);
        reject(error);
      }
    });
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');

      const timeoutId = setTimeout(() => {
        transaction.abort();
        reject(new Error('Transaction timeout'));
      }, TRANSACTION_TIMEOUT);

      transaction.oncomplete = () => clearTimeout(timeoutId);
      transaction.onerror = () => {
        clearTimeout(timeoutId);
        reject(transaction.error);
      };

      try {
        const store = transaction.objectStore(STORE_NAME);
        const results: Message[] = [];
        let pendingQueries = 2;

        const checkComplete = () => {
          if (--pendingQueries === 0) {
            // Sort by timestamp
            results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            console.log(`💬 Retrieved ${results.length} messages between ${user1Id} and ${user2Id}`);
            resolve(results);
          }
        };

        // Query messages from user1 to user2
        const index = store.index('senderId');
        const range1 = IDBKeyRange.only(user1Id);
        const request1 = index.openCursor(range1);

        request1.onerror = () => {
          console.error('❌ Failed to get messages from user1 to user2:', request1.error);
          reject(request1.error);
        };

        request1.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const message = cursor.value as Message;
            if (message.receiverId === user2Id && !message.isDeleted) {
              results.push(message);
            }
            cursor.continue();
          } else {
            checkComplete();
          }
        };

        // Query messages from user2 to user1
        const range2 = IDBKeyRange.only(user2Id);
        const request2 = index.openCursor(range2);

        request2.onerror = () => {
          console.error('❌ Failed to get messages from user2 to user1:', request2.error);
          reject(request2.error);
        };

        request2.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const message = cursor.value as Message;
            if (message.receiverId === user1Id && !message.isDeleted) {
              results.push(message);
            }
            cursor.continue();
          } else {
            checkComplete();
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error in getMessagesBetweenUsers:', error);
        reject(error);
      }
    });
  }

  async saveMessage(message: Message): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');

      const timeoutId = setTimeout(() => {
        transaction.abort();
        reject(new Error('Transaction timeout'));
      }, TRANSACTION_TIMEOUT);

      transaction.oncomplete = () => {
        clearTimeout(timeoutId);
        console.log('✅ Message saved and transaction committed:', message.id);
        resolve();
      };

      transaction.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ Transaction failed for saveMessage:', transaction.error);
        reject(transaction.error);
      };

      try {
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(message);

        request.onerror = () => {
          console.error('❌ Put request failed:', request.error);
          reject(request.error);
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error in saveMessage:', error);
        reject(error);
      }
    });
  }

  async updateMessage(message: Message): Promise<void> {
    return this.saveMessage(message);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');

      const timeoutId = setTimeout(() => {
        transaction.abort();
        reject(new Error('Transaction timeout'));
      }, TRANSACTION_TIMEOUT);

      transaction.oncomplete = () => {
        clearTimeout(timeoutId);
        console.log('✅ Message deleted and transaction committed:', messageId);
        resolve();
      };

      transaction.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ Transaction failed for deleteMessage:', transaction.error);
        reject(transaction.error);
      };

      try {
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(messageId);

        request.onerror = () => {
          console.error('❌ Delete request failed:', request.error);
          reject(request.error);
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error in deleteMessage:', error);
        reject(error);
      }
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

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');

      const timeoutId = setTimeout(() => {
        tx.abort();
        reject(new Error('Transaction timeout'));
      }, TRANSACTION_TIMEOUT);

      tx.oncomplete = () => {
        clearTimeout(timeoutId);
        console.log('✅ Messages marked as read and transaction committed');
        resolve();
      };

      tx.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ Transaction failed for markMessagesAsRead:', tx.error);
        reject(tx.error);
      };

      try {
        const store = tx.objectStore(STORE_NAME);

        for (const message of messages) {
          if (!message.isRead && (
            (message.senderId === user1Id && message.receiverId === user2Id) ||
            (message.senderId === user2Id && message.receiverId === user1Id)
          )) {
            store.put({ ...message, isRead: true });
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error in markMessagesAsRead:', error);
        reject(error);
      }
    });
  }
}

export const messagesDB = new MessagesDB();

// Helper to generate conversation ID
const getConversationId = (user1Id: string, user2Id: string): string => {
  return [user1Id, user2Id].sort().join('-');
};

// Get messages between two users (prioritize IndexedDB)
export const getMessagesBetweenUsersCustom = async (user1Id: string, user2Id: string): Promise<Message[]> => {
  // Always try IndexedDB first
  try {
    const idbMessages = await messagesDB.getMessagesBetweenUsers(user1Id, user2Id);
    if (idbMessages.length > 0) {
      console.log('Messages loaded from IndexedDB:', user1Id, user2Id, idbMessages.length, 'messages');
      return idbMessages;
    }
  } catch (error) {
    console.warn('Error reading from IndexedDB:', error);
  }

  // Fall back to localStorage for demo accounts or when IndexedDB is empty
  console.log('No messages in IndexedDB, using localStorage fallback');
  const { getMessagesBetweenUsers } = await import('./messageStorage');
  return getMessagesBetweenUsers(user1Id, user2Id);
};

// Send a message (stores in IndexedDB for all accounts - always persist)
export const sendMessageCustom = async (newMessage: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'reactions' | 'isStarred' | 'isDeleted'>): Promise<Message> => {
  const message: Message = {
    ...newMessage,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
    reactions: [],
    isStarred: false,
    isDeleted: false
  };

  // Always use IndexedDB for persistence
  try {
    await messagesDB.saveMessage(message);
    console.log('Message saved to IndexedDB:', message.id);
  } catch (error) {
    console.error('Failed to save to IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage if IndexedDB fails
    const { sendMessage: sendMessageLocal } = await import('./messageStorage');
    return sendMessageLocal(newMessage);
  }

  return message;
};

// Get conversations for a user (from IndexedDB with localStorage fallback)
export const getConversationsForUserCustom = async (userId: string): Promise<ChatConversation[]> => {
  // Always try IndexedDB first
  let partnerIds: string[] = [];
  try {
    partnerIds = await messagesDB.getConversationsForUser(userId);
    console.log('Conversations loaded from IndexedDB for user:', userId, partnerIds);
  } catch (error) {
    console.warn('Error getting conversations from IndexedDB:', error);
  }

  // If no conversations in IndexedDB, try localStorage as fallback
  if (partnerIds.length === 0) {
    console.log('No conversations in IndexedDB, trying localStorage fallback');
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

// Mark messages as read (prioritize IndexedDB)
export const markMessagesAsReadCustom = async (userId: string, partnerId: string): Promise<void> => {
  try {
    await messagesDB.markMessagesAsRead(userId, partnerId);
    console.log('Messages marked as read in IndexedDB');
  } catch (error) {
    console.warn('Error marking messages as read in IndexedDB, trying localStorage:', error);
    // Fallback to localStorage
    const { markConversationAsRead } = await import('./messageStorage');
    markConversationAsRead(userId, partnerId);
  }
};

// Add reaction to message (IndexedDB)
export const addReactionCustom = async (messageId: string, emoji: string, userId: string): Promise<Message | null> => {
  try {
    const messages = await messagesDB.getAllMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) return null;

    const message = messages[messageIndex];
    if (!message.reactions) {
      message.reactions = [];
    }

    // Remove existing reaction from this user with same emoji
    message.reactions = message.reactions.filter(
      r => !(r.userId === userId && r.emoji === emoji)
    );

    // Add new reaction
    message.reactions.push({
      emoji,
      userId,
      createdAt: new Date().toISOString()
    });

    await messagesDB.saveMessage(message);
    console.log('Reaction added to message in IndexedDB:', messageId, emoji);
    return message;
  } catch (error) {
    console.warn('Error adding reaction in IndexedDB, trying localStorage:', error);
    // Fallback to localStorage
    const { addReaction } = await import('./messageStorage');
    return addReaction(messageId, emoji, userId);
  }
};

// Delete message (IndexedDB)
export const deleteMessageCustom = async (messageId: string): Promise<boolean> => {
  try {
    await messagesDB.deleteMessage(messageId);
    console.log('Message deleted from IndexedDB:', messageId);
    return true;
  } catch (error) {
    console.warn('Error deleting message from IndexedDB, trying localStorage:', error);
    // Fallback to localStorage
    const { deleteMessage } = await import('./messageStorage');
    return deleteMessage(messageId);
  }
};