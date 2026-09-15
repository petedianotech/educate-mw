export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface NormalizedDictionaryEntry {
  word: string;
  normalizedWord: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  definitions?: string[];
  examples?: string[];
  synonyms: string[];
  antonyms: string[];
  audioUrl?: string;
  subject?: string;
  source: 'free-dictionary-api' | 'wiktionary-api' | 'firestore-cache' | 'local-cache' | 'academic-curriculum';
  createdAt?: string;
  updatedAt?: string;
  cachedAt?: number;
  isOfflineCached?: boolean;
  isStale?: boolean;
}

export interface WordOfTheDayInfo {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
  subject?: string;
  dateKey: string;
}
