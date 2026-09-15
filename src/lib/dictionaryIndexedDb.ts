import { NormalizedDictionaryEntry } from '../types/dictionary';

const DB_NAME = 'educate_mw_dictionary_db';
const DB_VERSION = 1;
const STORE_WORDS = 'words';
const STORE_SAVED = 'saved_words';
const RECENT_SEARCHES_KEY = 'mw_dict_recent_searches';
const MAX_RECENT_SEARCHES = 30;

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memoryWordsCache = new Map<string, NormalizedDictionaryEntry>();
const memorySavedWords = new Map<string, NormalizedDictionaryEntry>();

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_WORDS)) {
            db.createObjectStore(STORE_WORDS, { keyPath: 'normalizedWord' });
          }
          if (!db.objectStoreNames.contains(STORE_SAVED)) {
            db.createObjectStore(STORE_SAVED, { keyPath: 'normalizedWord' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (err) => {
          console.warn('IndexedDB dictionary open error, using memory fallback:', err);
          resolve(null);
        };

        request.onblocked = () => {
          console.warn('IndexedDB dictionary open blocked');
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB not accessible, using memory fallback:', err);
        resolve(null);
      }
    });
  }

  return dbPromise;
}

/**
 * Get a cached word from IndexedDB or memory/localStorage
 */
export async function getCachedWordFromDb(normalizedWord: string): Promise<NormalizedDictionaryEntry | null> {
  if (!normalizedWord) return null;
  const cleanKey = normalizedWord.trim().toLowerCase();

  // 1. Check in-memory fast cache
  if (memoryWordsCache.has(cleanKey)) {
    return memoryWordsCache.get(cleanKey)!;
  }

  // 2. Check IndexedDB
  try {
    const db = await getIDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_WORDS, 'readonly');
          const store = tx.objectStore(STORE_WORDS);
          const req = store.get(cleanKey);

          req.onsuccess = () => {
            if (req.result) {
              memoryWordsCache.set(cleanKey, req.result);
              resolve(req.result);
            } else {
              resolve(null);
            }
          };

          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
  } catch (err) {
    console.warn('IndexedDB get word error:', err);
  }

  // 3. Fallback to localStorage
  try {
    const fallbackRaw = localStorage.getItem(`mw_dict_w_${cleanKey}`);
    if (fallbackRaw) {
      const parsed = JSON.parse(fallbackRaw);
      memoryWordsCache.set(cleanKey, parsed);
      return parsed;
    }
  } catch {}

  return null;
}

/**
 * Save word entry to IndexedDB and memory cache
 */
export async function saveWordToDb(entry: NormalizedDictionaryEntry): Promise<void> {
  if (!entry || !entry.normalizedWord) return;
  const cleanKey = entry.normalizedWord.trim().toLowerCase();

  // Update in-memory
  memoryWordsCache.set(cleanKey, entry);

  // Update IndexedDB
  try {
    const db = await getIDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_WORDS, 'readwrite');
          const store = tx.objectStore(STORE_WORDS);
          store.put(entry);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch (err) {
    console.warn('IndexedDB save word error:', err);
  }

  // Save lightweight copy to localStorage for immediate resilience if low quota
  try {
    localStorage.setItem(`mw_dict_w_${cleanKey}`, JSON.stringify(entry));
  } catch {}
}

/**
 * Get all saved/favorite words
 */
export async function getSavedWordsFromDb(): Promise<NormalizedDictionaryEntry[]> {
  const result: NormalizedDictionaryEntry[] = [];

  try {
    const db = await getIDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_SAVED, 'readonly');
          const store = tx.objectStore(STORE_SAVED);
          const req = store.getAll();

          req.onsuccess = () => {
            const list = req.result || [];
            list.forEach((item: NormalizedDictionaryEntry) => {
              memorySavedWords.set(item.normalizedWord.toLowerCase(), item);
            });
            resolve(list);
          };

          req.onerror = () => resolve(Array.from(memorySavedWords.values()));
        } catch {
          resolve(Array.from(memorySavedWords.values()));
        }
      });
    }
  } catch (err) {
    console.warn('IndexedDB get saved words error:', err);
  }

  // Fallback to localStorage saved words array
  try {
    const raw = localStorage.getItem('mw_dict_saved_words_list');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  return Array.from(memorySavedWords.values());
}

/**
 * Save word to favorites
 */
export async function saveFavoriteWordToDb(entry: NormalizedDictionaryEntry): Promise<void> {
  if (!entry || !entry.normalizedWord) return;
  const cleanKey = entry.normalizedWord.trim().toLowerCase();

  memorySavedWords.set(cleanKey, entry);

  try {
    const db = await getIDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_SAVED, 'readwrite');
          const store = tx.objectStore(STORE_SAVED);
          store.put(entry);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch (err) {
    console.warn('IndexedDB save favorite error:', err);
  }

  try {
    const list = Array.from(memorySavedWords.values());
    localStorage.setItem('mw_dict_saved_words_list', JSON.stringify(list));
  } catch {}
}

/**
 * Remove word from favorites
 */
export async function removeFavoriteWordFromDb(normalizedWord: string): Promise<void> {
  if (!normalizedWord) return;
  const cleanKey = normalizedWord.trim().toLowerCase();

  memorySavedWords.delete(cleanKey);

  try {
    const db = await getIDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_SAVED, 'readwrite');
          const store = tx.objectStore(STORE_SAVED);
          store.delete(cleanKey);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch (err) {
    console.warn('IndexedDB delete favorite error:', err);
  }

  try {
    const list = Array.from(memorySavedWords.values());
    localStorage.setItem('mw_dict_saved_words_list', JSON.stringify(list));
  } catch {}
}

/**
 * Check if a word is favorited
 */
export async function isWordFavoriteInDb(normalizedWord: string): Promise<boolean> {
  if (!normalizedWord) return false;
  const cleanKey = normalizedWord.trim().toLowerCase();

  if (memorySavedWords.has(cleanKey)) {
    return true;
  }

  try {
    const db = await getIDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_SAVED, 'readonly');
          const store = tx.objectStore(STORE_SAVED);
          const req = store.get(cleanKey);
          req.onsuccess = () => resolve(Boolean(req.result));
          req.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    }
  } catch {}

  try {
    const raw = localStorage.getItem('mw_dict_saved_words_list');
    if (raw) {
      const list: NormalizedDictionaryEntry[] = JSON.parse(raw);
      return list.some((item) => item.normalizedWord.toLowerCase() === cleanKey);
    }
  } catch {}

  return false;
}

/**
 * Get recent searches list
 */
export function getRecentSearchesList(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_RECENT_SEARCHES);
      }
    }
  } catch {}
  return [];
}

/**
 * Add word to recent searches list (max 30, deduplicated, most recent first)
 */
export function addWordToRecentSearches(word: string): string[] {
  if (!word || !word.trim()) return getRecentSearchesList();
  const cleanWord = word.trim();
  const lower = cleanWord.toLowerCase();

  try {
    const current = getRecentSearchesList();
    const filtered = current.filter((w) => w.toLowerCase() !== lower);
    const updated = [cleanWord, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [cleanWord];
  }
}

/**
 * Clear all recent searches
 */
export function clearAllRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {}
}
