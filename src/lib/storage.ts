import type { StampConfig } from './stamp';

const HISTORY_STORAGE_KEY = 'daily-stamp-maker:history:v1';
const LEGACY_FAVORITES_STORAGE_KEY = 'daily-stamp-maker:favorites:v1';
export const MAX_STAMP_HISTORY = 10;

export type StampHistoryEntry = {
  id: string;
  topText: string;
  bottomText: string;
  color: string;
  pinned: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isStampHistoryEntry = (value: unknown): value is StampHistoryEntry => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.topText === 'string' &&
    typeof value.bottomText === 'string' &&
    typeof value.color === 'string' &&
    typeof value.pinned === 'boolean'
  );
};

const isLegacyFavorite = (value: unknown): value is Pick<StampHistoryEntry, 'id' | 'topText' | 'bottomText' | 'color'> => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.topText === 'string' &&
    typeof value.bottomText === 'string' &&
    typeof value.color === 'string'
  );
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createSnapshot = (config: Pick<StampConfig, 'topText' | 'bottomText' | 'color'>) => ({
  topText: config.topText.trim(),
  bottomText: config.bottomText.trim(),
  color: config.color,
});

const sameStamp = (
  entry: Pick<StampHistoryEntry, 'topText' | 'bottomText' | 'color'>,
  snapshot: Pick<StampHistoryEntry, 'topText' | 'bottomText' | 'color'>,
) => {
  return (
    entry.topText === snapshot.topText &&
    entry.bottomText === snapshot.bottomText &&
    entry.color.toLowerCase() === snapshot.color.toLowerCase()
  );
};

const capHistory = (entries: StampHistoryEntry[]): StampHistoryEntry[] => {
  const capped = [...entries];
  while (capped.length > MAX_STAMP_HISTORY) {
    let removeIndex = -1;
    for (let index = capped.length - 1; index >= 0; index -= 1) {
      if (!capped[index].pinned) {
        removeIndex = index;
        break;
      }
    }
    if (removeIndex === -1) return capped.slice(0, MAX_STAMP_HISTORY);
    capped.splice(removeIndex, 1);
  }
  return capped;
};

const sortPinnedFirst = (entries: StampHistoryEntry[]): StampHistoryEntry[] => {
  return [...entries].sort((first, second) => Number(second.pinned) - Number(first.pinned));
};

const loadLegacyFavorites = (): StampHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortPinnedFirst(capHistory(
      parsed.filter(isLegacyFavorite).map((favorite) => ({
        id: favorite.id,
        topText: favorite.topText,
        bottomText: favorite.bottomText,
        color: favorite.color,
        pinned: true,
      })),
    ));
  } catch {
    return [];
  }
};

export const loadHistory = (): StampHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? sortPinnedFirst(capHistory(parsed.filter(isStampHistoryEntry))) : [];
    }

    const legacyHistory = loadLegacyFavorites();
    if (legacyHistory.length > 0) {
      saveHistory(legacyHistory);
    }
    return legacyHistory;
  } catch {
    return [];
  }
};

export const saveHistory = (history: StampHistoryEntry[]): void => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(capHistory(history)));
};

export const recordHistory = (history: StampHistoryEntry[], config: StampConfig): StampHistoryEntry[] => {
  const snapshot = createSnapshot(config);
  const existing = history.find((entry) => sameStamp(entry, snapshot));
  const remaining = history.filter((entry) => !sameStamp(entry, snapshot));
  const nextEntry: StampHistoryEntry = existing
    ? { ...existing, ...snapshot }
    : { id: createId(), ...snapshot, pinned: false };
  return capHistory([nextEntry, ...remaining]);
};

export const toggleHistoryPin = (history: StampHistoryEntry[], historyId: string): StampHistoryEntry[] => {
  return history.map((entry) => (entry.id === historyId ? { ...entry, pinned: !entry.pinned } : entry));
};

export const removeHistoryEntry = (history: StampHistoryEntry[], historyId: string): StampHistoryEntry[] => {
  return history.filter((entry) => entry.id !== historyId);
};

export const getHistoryLabel = (entry: Pick<StampHistoryEntry, 'topText' | 'bottomText'>): string => {
  return `${entry.topText || '上段'} / ${entry.bottomText || '名前'}`;
};
