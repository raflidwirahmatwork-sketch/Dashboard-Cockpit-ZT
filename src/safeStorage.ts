// Robust in-memory fallback store in case localStorage is blocked in sandboxed iframe environments.
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem failed for key "${key}", falling back to memory store:`, e);
      return memoryStore[key] !== undefined ? memoryStore[key] : null;
    }
  },
  
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}", falling back to memory store:`, e);
      memoryStore[key] = value;
    }
  },
  
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem failed for key "${key}", falling back to memory store:`, e);
      delete memoryStore[key];
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("localStorage.clear failed, clearing memory store instead:", e);
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
    }
  }
};
