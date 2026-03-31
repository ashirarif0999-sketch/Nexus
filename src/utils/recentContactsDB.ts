const DB_NAME = 'NexusoRecentContacts';
const DB_VERSION = 1;
const STORE_NAME = 'recentContacts';

class RecentContactsDB {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open recent contacts DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
          store.createIndex('lastContacted', 'lastContacted', { unique: false });
        }
      };
    });
  }

  async getRecentContacts(currentUserId: string): Promise<string[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const contacts = request.result
          .filter((c: any) => c.userId !== currentUserId)
          .sort((a: any, b: any) => new Date(b.lastContacted).getTime() - new Date(a.lastContacted).getTime())
          .map((c: any) => c.contactId);
        resolve(contacts);
      };
    });
  }

  async addRecentContact(currentUserId: string, contactId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({
        userId: currentUserId,
        contactId,
        lastContacted: new Date().toISOString()
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearRecentContacts(currentUserId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(currentUserId);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const recentContactsDB = new RecentContactsDB();