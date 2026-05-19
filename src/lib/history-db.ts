export interface WatchHistoryItem {
  animeId: number;
  title: string;
  poster: string;
  episodeNumber: number;
  watchedAt: number; // timestamp
}

const DB_NAME = "kinoharth_db";
const DB_VERSION = 1;
const STORE_NAME = "watch_history";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("IndexedDB is only available in the browser.");
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "animeId" });
      }
    };
  });
}

/**
 * Saves or updates an item in the watch history database.
 */
export async function saveWatchHistory(item: Omit<WatchHistoryItem, "watchedAt">): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const historyItem: WatchHistoryItem = {
        ...item,
        watchedAt: Date.now(),
      };

      const request = store.put(historyItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save watch history:", error);
  }
}

/**
 * Retrieves the full watch history, sorted by most recently watched first.
 */
export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as WatchHistoryItem[];
        // Sort by watchedAt descending (most recently watched first)
        results.sort((a, b) => b.watchedAt - a.watchedAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get watch history:", error);
    return [];
  }
}

/**
 * Removes a specific anime from the watch history.
 */
export async function removeWatchHistory(animeId: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(animeId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete watch history item:", error);
  }
}
