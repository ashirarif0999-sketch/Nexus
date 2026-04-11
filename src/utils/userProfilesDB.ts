const DB_NAME = 'NexusoUserProfiles';
const DB_VERSION = 1;
const STORE_NAME = 'profiles';

export interface UserProfile {
  id: string;
  avatarUrl?: string;
  name?: string;
  bio?: string;
  location?: string;
  lastUpdated: number;
}

class UserProfilesDB {
  private db: IDBDatabase | null = null;

  private async openDB(retries = 3): Promise<IDBDatabase> {
    if (this.db) return this.db;

    const attemptOpen = (): Promise<IDBDatabase> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
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
            store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          }
        };
      });
    };

    return attemptOpen();
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const db = await this.openDB();
    profile.lastUpdated = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(profile);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id'>>): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(userId);
      getRequest.onsuccess = () => {
        const existingProfile = getRequest.result;
        const updatedProfile = {
          ...existingProfile,
          ...updates,
          id: userId,
          lastUpdated: Date.now()
        };
        const putRequest = store.put(updatedProfile);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const userProfilesDB = new UserProfilesDB();