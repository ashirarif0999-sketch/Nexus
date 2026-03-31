import { UserRole } from '../types';

const DB_NAME = 'NexusoSavedAccounts';
const DB_VERSION = 1;
const STORE_NAME = 'accounts';

export interface SavedAccount {
  id: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  name?: string;
  lastLogin: number;
}

class SavedAccountsDB {
  private db: IDBDatabase | null = null;

  private async openDB(retries = 3): Promise<IDBDatabase> {
    if (this.db) return this.db;

    const attemptOpen = (): Promise<IDBDatabase> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          // Retry logic: if we have retries left, try again
          if (retries > 0) {
            console.warn(`IndexedDB open failed, retrying... (${retries} attempts left)`);
            setTimeout(() => {
              attemptOpen().then(resolve).catch(reject);
            }, 100);
          } else {
            reject(request.error || new Error('Failed to open IndexedDB after multiple attempts'));
          }
        };
        request.onsuccess = () => {
          this.db = request.result;
          // Handle connection close events
          this.db.onclose = () => {
            this.db = null;
          };
          this.db.onerror = (event) => {
            console.error('IndexedDB error:', event);
          };
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('email', 'email', { unique: false });
            store.createIndex('role', 'role', { unique: false });
            store.createIndex('lastLogin', 'lastLogin', { unique: false });
          }
        };
      });
    };

    return attemptOpen();
  }

  async getAllAccounts(): Promise<SavedAccount[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAccountsByRole(role: UserRole): Promise<SavedAccount[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('role');
      const request = index.getAll(role);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAccountByEmail(email: string, role: UserRole): Promise<SavedAccount | undefined> {
    const accounts = await this.getAccountsByRole(role);
    return accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
  }

  async saveAccount(account: Omit<SavedAccount, 'id' | 'lastLogin'>): Promise<SavedAccount> {
    const db = await this.openDB();
    const newAccount: SavedAccount = {
      ...account,
      id: crypto.randomUUID(),
      lastLogin: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newAccount);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(newAccount);
    });
  }

  async updateAccountLogin(id: string): Promise<void> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const account = getRequest.result;
        if (account) {
          account.lastLogin = Date.now();
          const putRequest = store.put(account);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteAccount(id: string): Promise<void> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllAccounts(): Promise<void> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const savedAccountsDB = new SavedAccountsDB();