import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  DictionaryDefinition,
  DictionaryMeaning,
  DictionaryPhonetic,
  NormalizedDictionaryEntry,
  WordOfTheDayInfo,
} from '../types/dictionary';
import {
  getCachedWordFromDb,
  saveWordToDb,
  getSavedWordsFromDb,
  saveFavoriteWordToDb,
  removeFavoriteWordFromDb,
  isWordFavoriteInDb,
  addWordToRecentSearches,
  getRecentSearchesList,
  clearAllRecentSearches,
} from '../lib/dictionaryIndexedDb';
import { ACADEMIC_DICTIONARY, POPULAR_DICTIONARY_WORDS } from '../data/academicDictionary';

// Cache validity duration (30 days in milliseconds)
export const DICTIONARY_CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const FREE_DICT_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const API_TIMEOUT_MS = 30000;

// In-flight active promise map to prevent duplicate concurrent network calls
const inFlightRequests = new Map<string, Promise<NormalizedDictionaryEntry>>();

/**
 * Standardize and clean word search inputs
 */
export function normalizeSearchWord(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Keep alphanumeric, spaces, and hyphens
    .replace(/\s+/g, ' ');
}

/**
 * Capitalize first letter for display
 */
export function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Extract best audio URL from Free Dictionary API phonetics array
 */
function extractBestAudioUrl(phonetics: any[]): string | undefined {
  if (!Array.isArray(phonetics) || phonetics.length === 0) return undefined;

  // 1. Prefer audio with -us or -uk mp3
  const usAudio = phonetics.find(
    (p) => typeof p.audio === 'string' && p.audio.trim() && (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3'))
  );
  if (usAudio?.audio) {
    return formatAudioUrl(usAudio.audio);
  }

  // 2. Any valid audio url
  const anyAudio = phonetics.find((p) => typeof p.audio === 'string' && p.audio.trim().length > 0);
  if (anyAudio?.audio) {
    return formatAudioUrl(anyAudio.audio);
  }

  return undefined;
}

function formatAudioUrl(url: string): string {
  let clean = url.trim();
  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  }
  return clean;
}

/**
 * Convert raw Free Dictionary API JSON into clean NormalizedDictionaryEntry
 */
function parseApiEntry(apiData: any, rawWord: string, normWord: string): NormalizedDictionaryEntry {
  const phoneticsList: DictionaryPhonetic[] = Array.isArray(apiData.phonetics)
    ? apiData.phonetics
        .filter((p: any) => p && (p.text || p.audio))
        .map((p: any) => ({
          text: p.text,
          audio: p.audio ? formatAudioUrl(p.audio) : undefined,
          sourceUrl: p.sourceUrl,
        }))
    : [];

  const bestPhoneticText =
    apiData.phonetic ||
    phoneticsList.find((p) => p.text)?.text ||
    '';

  const audioUrl = extractBestAudioUrl(apiData.phonetics);

  const globalSynonymsSet = new Set<string>();
  const globalAntonymsSet = new Set<string>();
  const allDefinitionsList: string[] = [];
  const allExamplesList: string[] = [];

  const meanings: DictionaryMeaning[] = (apiData.meanings || []).map((m: any) => {
    const meaningSynonyms: string[] = Array.isArray(m.synonyms) ? m.synonyms.filter(Boolean) : [];
    const meaningAntonyms: string[] = Array.isArray(m.antonyms) ? m.antonyms.filter(Boolean) : [];

    meaningSynonyms.forEach((s) => globalSynonymsSet.add(s.toLowerCase()));
    meaningAntonyms.forEach((a) => globalAntonymsSet.add(a.toLowerCase()));

    const definitions: DictionaryDefinition[] = (m.definitions || []).map((d: any) => {
      const defText = typeof d.definition === 'string' ? d.definition.trim() : '';
      if (defText) allDefinitionsList.push(defText);

      const exText = typeof d.example === 'string' ? d.example.trim() : undefined;
      if (exText) allExamplesList.push(exText);

      const defSynonyms: string[] = Array.isArray(d.synonyms) ? d.synonyms.filter(Boolean) : [];
      const defAntonyms: string[] = Array.isArray(d.antonyms) ? d.antonyms.filter(Boolean) : [];

      defSynonyms.forEach((s) => globalSynonymsSet.add(s.toLowerCase()));
      defAntonyms.forEach((a) => globalAntonymsSet.add(a.toLowerCase()));

      return {
        definition: defText,
        example: exText,
        synonyms: defSynonyms.length > 0 ? defSynonyms : undefined,
        antonyms: defAntonyms.length > 0 ? defAntonyms : undefined,
      };
    });

    return {
      partOfSpeech: m.partOfSpeech || 'general',
      definitions,
      synonyms: meaningSynonyms.length > 0 ? meaningSynonyms : undefined,
      antonyms: meaningAntonyms.length > 0 ? meaningAntonyms : undefined,
    };
  });

  // Check if there is an academic syllabus subject tag
  let subject: string | undefined = undefined;
  const academicMatch = ACADEMIC_DICTIONARY[normWord];
  if (academicMatch?.subject) {
    subject = academicMatch.subject;
  }

  const now = new Date().toISOString();

  return {
    word: apiData.word || capitalizeWord(rawWord),
    normalizedWord: normWord,
    phonetic: bestPhoneticText,
    phonetics: phoneticsList,
    meanings,
    definitions: allDefinitionsList.slice(0, 10),
    examples: allExamplesList.slice(0, 10),
    synonyms: Array.from(globalSynonymsSet).slice(0, 16),
    antonyms: Array.from(globalAntonymsSet).slice(0, 16),
    audioUrl,
    subject,
    source: 'free-dictionary-api',
    createdAt: now,
    updatedAt: now,
    cachedAt: Date.now(),
    isOfflineCached: true,
  };
}

/**
 * Convert curated academic dictionary item to normalized entry
 */
function convertCuratedToNormalized(curated: typeof ACADEMIC_DICTIONARY[string]): NormalizedDictionaryEntry {
  const normWord = normalizeSearchWord(curated.word);
  const allDefinitions = curated.meanings.flatMap((m) => m.definitions.map((d) => d.definition));
  const allExamples = curated.meanings
    .flatMap((m) => m.definitions.map((d) => d.example))
    .filter((e): e is string => Boolean(e));

  const now = new Date().toISOString();

  return {
    word: capitalizeWord(curated.word),
    normalizedWord: normWord,
    phonetic: curated.phonetic || '',
    meanings: curated.meanings.map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: m.definitions.map((d) => ({
        definition: d.definition,
        example: d.example,
      })),
      synonyms: curated.synonyms,
    })),
    definitions: allDefinitions,
    examples: allExamples,
    synonyms: curated.synonyms || [],
    antonyms: [],
    subject: curated.subject || 'MSCE Academic Curriculum',
    source: 'academic-curriculum',
    createdAt: now,
    updatedAt: now,
    cachedAt: Date.now(),
    isOfflineCached: true,
  };
}

/**
 * Save entry to Firestore dictionary_cache collection safely
 */
async function saveToFirestoreCache(entry: NormalizedDictionaryEntry): Promise<void> {
  try {
    const docId = entry.normalizedWord;
    const docRef = doc(db, 'dictionary_cache', docId);
    await setDoc(
      docRef,
      {
        word: entry.word,
        normalizedWord: entry.normalizedWord,
        phonetic: entry.phonetic || '',
        phonetics: entry.phonetics || [],
        meanings: entry.meanings || [],
        definitions: entry.definitions || [],
        examples: entry.examples || [],
        synonyms: entry.synonyms || [],
        antonyms: entry.antonyms || [],
        audioUrl: entry.audioUrl || '',
        subject: entry.subject || '',
        source: entry.source,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cachedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (firestoreErr) {
    // Non-blocking: Firestore permissions or offline state should not break the app
    console.warn('Firestore dictionary caching skipped/error:', firestoreErr);
  }
}

/**
 * Helper to strip HTML tags from a string
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Parse Wiktionary REST API page definition format to NormalizedDictionaryEntry
 */
function parseWiktionaryEntry(data: any, rawWord: string, normWord: string): NormalizedDictionaryEntry {
  const word = data.en?.[0]?.word || rawWord;
  const meanings: DictionaryMeaning[] = [];
  const allDefinitions: string[] = [];
  const allExamples: string[] = [];

  const enMeanings = data.en || [];
  enMeanings.forEach((m: any) => {
    const partOfSpeech = (m.partOfSpeech || 'general').toLowerCase();
    const definitions: DictionaryDefinition[] = [];

    const rawDefs = m.definitions || [];
    rawDefs.slice(0, 3).forEach((d: any) => {
      const cleanDef = stripHtml(d.definition);
      if (!cleanDef) return;

      allDefinitions.push(cleanDef);

      let example: string | undefined = undefined;
      if (d.parsedExamples && d.parsedExamples.length > 0) {
        example = stripHtml(d.parsedExamples[0].example || d.parsedExamples[0]);
      } else if (d.examples && d.examples.length > 0) {
        example = stripHtml(d.examples[0]);
      }

      if (example) {
        allExamples.push(example);
      }

      definitions.push({
        definition: cleanDef,
        example,
      });
    });

    if (definitions.length > 0) {
      meanings.push({
        partOfSpeech,
        definitions,
      });
    }
  });

  const now = new Date().toISOString();
  return {
    word: capitalizeWord(word),
    normalizedWord: normWord,
    phonetic: '',
    meanings,
    definitions: allDefinitions,
    examples: allExamples,
    synonyms: [],
    antonyms: [],
    source: 'wiktionary-api',
    createdAt: now,
    updatedAt: now,
    cachedAt: Date.now(),
    isOfflineCached: true,
  };
}

/**
 * Fallback to Wiktionary REST API (No AI, 100% free, highly reliable)
 */
async function lookupViaWiktionary(rawWord: string, normWord: string): Promise<NormalizedDictionaryEntry> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // Wait up to 30 seconds

  try {
    const encodedWord = encodeURIComponent(normWord);
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodedWord}`, {
      signal: controller.signal,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'EducateMW/1.0 (petedianotech@gmail.com) WiktionaryAPI/1.0'
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Wiktionary API response error (${res.status})`);
    }

    const data = await res.json();
    if (!data || !data.en || data.en.length === 0) {
      throw new Error(`No English definitions found on Wiktionary for "${rawWord}".`);
    }

    const parsedEntry = parseWiktionaryEntry(data, rawWord, normWord);

    // Save to local IndexedDB & Firestore Cache
    saveWordToDb(parsedEntry).catch(() => {});
    saveToFirestoreCache(parsedEntry).catch(() => {});

    return parsedEntry;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Wiktionary lookup failed:', err);
    throw err;
  }
}

/**
 * Main Search Function with complete offline-first & cached tiered architecture
 */
export async function lookupWord(rawWord: string): Promise<NormalizedDictionaryEntry> {
  const normWord = normalizeSearchWord(rawWord);
  if (!normWord) {
    throw new Error('Please enter a valid word to search.');
  }

  // Register in recent searches immediately
  addWordToRecentSearches(rawWord.trim());

  // Prevent duplicate simultaneous requests for the exact same word
  if (inFlightRequests.has(normWord)) {
    return inFlightRequests.get(normWord)!;
  }

  const lookupPromise = (async (): Promise<NormalizedDictionaryEntry> => {
    // -------------------------------------------------------------
    // Step 1: Check Local Offline Cache (IndexedDB / Memory)
    // -------------------------------------------------------------
    let localResult: NormalizedDictionaryEntry | null = null;
    try {
      localResult = await getCachedWordFromDb(normWord);
    } catch (e) {
      console.warn('Local dictionary cache read error:', e);
    }

    if (localResult) {
      const cacheAge = Date.now() - (localResult.cachedAt || 0);
      const isFresh = cacheAge < DICTIONARY_CACHE_DURATION_MS;

      if (isFresh) {
        return {
          ...localResult,
          isOfflineCached: true,
          source: localResult.source || 'local-cache',
        };
      }

      // If stale, return immediately for instant UI response and refresh in background
      triggerBackgroundRefresh(normWord, rawWord);
      return {
        ...localResult,
        isOfflineCached: true,
        isStale: true,
      };
    }

    // -------------------------------------------------------------
    // Step 2: Check Curated Academic Curriculum Dictionary
    // -------------------------------------------------------------
    if (ACADEMIC_DICTIONARY[normWord]) {
      const entry = convertCuratedToNormalized(ACADEMIC_DICTIONARY[normWord]);
      // Save locally to IndexedDB for offline resilience
      saveWordToDb(entry).catch(() => {});
      saveToFirestoreCache(entry).catch(() => {});
      return entry;
    }

    // -------------------------------------------------------------
    // Step 3: Check Firestore Cache (if online)
    // -------------------------------------------------------------
    const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

    if (isOnline) {
      try {
        const firestoreDoc = await getDoc(doc(db, 'dictionary_cache', normWord));
        if (firestoreDoc.exists()) {
          const fsData = firestoreDoc.data() as NormalizedDictionaryEntry;
          if (fsData && fsData.meanings && fsData.meanings.length > 0) {
            const entry: NormalizedDictionaryEntry = {
              ...fsData,
              normalizedWord: normWord,
              source: 'firestore-cache',
              cachedAt: fsData.cachedAt || Date.now(),
              isOfflineCached: true,
            };

            // Save to local IndexedDB for future offline usage
            saveWordToDb(entry).catch(() => {});
            return entry;
          }
        }
      } catch (fsErr) {
        console.warn('Firestore cache lookup notice:', fsErr);
      }
    }

    // -------------------------------------------------------------
    // Step 4: Request Free Dictionary API
    // -------------------------------------------------------------
    if (!isOnline) {
      // Check partial match in academic dictionary
      const partialCurated = Object.keys(ACADEMIC_DICTIONARY).find(
        (k) => k.includes(normWord) || normWord.includes(k)
      );
      if (partialCurated) {
        const entry = convertCuratedToNormalized(ACADEMIC_DICTIONARY[partialCurated]);
        saveWordToDb(entry).catch(() => {});
        return entry;
      }

      throw new Error(
        `You're offline. "${rawWord}" hasn't been saved on your device yet. Connect to the internet and try again.`
      );
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      const encodedWord = encodeURIComponent(normWord);

      const res = await fetch(`${FREE_DICT_BASE_URL}/${encodedWord}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        try {
          return await lookupViaWiktionary(rawWord, normWord);
        } catch (wiktionaryErr) {
          const partialCurated = Object.keys(ACADEMIC_DICTIONARY).find(
            (k) => k.includes(normWord) || normWord.includes(k)
          );
          if (partialCurated) {
            const entry = convertCuratedToNormalized(ACADEMIC_DICTIONARY[partialCurated]);
            saveWordToDb(entry).catch(() => {});
            return entry;
          }
          throw new Error(`We couldn't find "${rawWord}". Please check the spelling and try again.`);
        }
      }

      if (!res.ok) {
        try {
          return await lookupViaWiktionary(rawWord, normWord);
        } catch (wiktionaryErr) {
          throw new Error(`Dictionary service temporarily unavailable (${res.status}). Please try again shortly.`);
        }
      }

      const rawJson = await res.json();
      if (!Array.isArray(rawJson) || rawJson.length === 0) {
        try {
          return await lookupViaWiktionary(rawWord, normWord);
        } catch (wiktionaryErr) {
          throw new Error(`No definition entries returned for "${rawWord}".`);
        }
      }

      const parsedEntry = parseApiEntry(rawJson[0], rawWord, normWord);

      // Save to local IndexedDB & Firestore
      saveWordToDb(parsedEntry).catch(() => {});
      saveToFirestoreCache(parsedEntry).catch(() => {});

      return parsedEntry;
    } catch (apiError: any) {
      try {
        return await lookupViaWiktionary(rawWord, normWord);
      } catch (wiktionaryErr) {
        if (apiError.name === 'AbortError') {
          const partialCurated = Object.keys(ACADEMIC_DICTIONARY).find(
            (k) => k.includes(normWord) || normWord.includes(k)
          );
          if (partialCurated) {
            return convertCuratedToNormalized(ACADEMIC_DICTIONARY[partialCurated]);
          }
          throw new Error(`Request timed out searching for "${rawWord}". Please verify your internet connection and try again.`);
        }

        if (apiError.message && (apiError.message.includes('offline') || apiError.message.includes('spelling') || apiError.message.includes('unavailable'))) {
          throw apiError;
        }

        const partialCurated = Object.keys(ACADEMIC_DICTIONARY).find(
          (k) => k.includes(normWord) || normWord.includes(k)
        );
        if (partialCurated) {
          return convertCuratedToNormalized(ACADEMIC_DICTIONARY[partialCurated]);
        }

        throw new Error(`Unable to fetch definition for "${rawWord}". Please check your network connection and retry.`);
      }
    }
  })();

  inFlightRequests.set(normWord, lookupPromise);

  try {
    const result = await lookupPromise;
    return result;
  } finally {
    inFlightRequests.delete(normWord);
  }
}

/**
 * Background refresh helper for stale cache items
 */
async function triggerBackgroundRefresh(normWord: string, rawWord: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  try {
    const encodedWord = encodeURIComponent(normWord);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${FREE_DICT_BASE_URL}/${encodedWord}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const rawJson = await res.json();
      if (Array.isArray(rawJson) && rawJson.length > 0) {
        const refreshed = parseApiEntry(rawJson[0], rawWord, normWord);
        await saveWordToDb(refreshed);
        await saveToFirestoreCache(refreshed);
      }
    }
  } catch {
    // Silently ignore background refresh errors
  }
}

/**
 * Get Deterministic Cached Word of the Day
 */
export function getWordOfTheDay(): WordOfTheDayInfo {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  // Use date hash to pick from curated list
  const academicKeys = Object.keys(ACADEMIC_DICTIONARY);
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % academicKeys.length;
  const chosenKey = academicKeys[index];
  const item = ACADEMIC_DICTIONARY[chosenKey];

  const firstDef = item.meanings[0]?.definitions[0];

  return {
    word: capitalizeWord(item.word),
    phonetic: item.phonetic,
    partOfSpeech: item.meanings[0]?.partOfSpeech || 'noun',
    definition: firstDef?.definition || 'An essential concept in the academic curriculum.',
    example: firstDef?.example,
    subject: item.subject,
    dateKey,
  };
}

/**
 * Favorites / Saved Words operations
 */
export async function getSavedWords(): Promise<NormalizedDictionaryEntry[]> {
  return getSavedWordsFromDb();
}

export async function toggleFavoriteWord(entry: NormalizedDictionaryEntry): Promise<boolean> {
  const isFav = await isWordFavoriteInDb(entry.normalizedWord);
  if (isFav) {
    await removeFavoriteWordFromDb(entry.normalizedWord);
    syncUserFavoriteToFirestore(entry.normalizedWord, false).catch(() => {});
    return false;
  } else {
    await saveFavoriteWordToDb(entry);
    syncUserFavoriteToFirestore(entry.normalizedWord, true, entry).catch(() => {});
    return true;
  }
}

export async function isWordSaved(normalizedWord: string): Promise<boolean> {
  return isWordFavoriteInDb(normalizedWord);
}

/**
 * Sync favorite to user's profile in Firestore if signed in
 */
async function syncUserFavoriteToFirestore(
  normalizedWord: string,
  isSaved: boolean,
  entry?: NormalizedDictionaryEntry
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userFavDoc = doc(db, 'users', user.uid, 'saved_words', normalizedWord);
    if (isSaved && entry) {
      await setDoc(userFavDoc, {
        word: entry.word,
        normalizedWord: entry.normalizedWord,
        phonetic: entry.phonetic || '',
        subject: entry.subject || '',
        savedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore saved words sync error:', err);
  }
}

export {
  getRecentSearchesList,
  clearAllRecentSearches,
};
