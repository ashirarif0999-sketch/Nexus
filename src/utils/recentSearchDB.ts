const DB_NAME = 'NexusoSearch';
const DB_VERSION = 1;
const STORE_NAME = 'recentSearches';

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

const isIndexedDBAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' &&
           typeof window.indexedDB !== 'undefined' &&
           window.indexedDB !== null;
  } catch (error) {
    return false;
  }
};

class RecentSearchDB {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (!isIndexedDBAvailable()) {
      throw new Error('IndexedDB is not supported');
    }
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('query', 'query', { unique: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getAll(): Promise<RecentSearch[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev'); // Sort by timestamp descending
        
        const results: RecentSearch[] = [];
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && results.length < 10) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('DB Error:', error);
      return [];
    }
  }

  async add(query: string): Promise<void> {
    if (!query.trim()) return;
    try {
      const db = await this.openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const index = store.index('query');
        const getRequest = index.get(query);
        
        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          if (existing) {
            existing.timestamp = Date.now();
            store.put(existing).onsuccess = () => resolve();
          } else {
            const newItem: RecentSearch = {
              id: crypto.randomUUID(),
              query: query.trim(),
              timestamp: Date.now()
            };
            store.add(newItem).onsuccess = () => resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('DB Error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
    } catch (error) {
      console.error('DB Error:', error);
    }
  }
}

export const recentSearchDB = new RecentSearchDB();
