import type { DateFormat, StampConfig } from './stamp';

const STORAGE_KEY = 'daily-stamp-maker:favorites:v1';

export type FavoriteStamp = {
  id: string;
  label: string;
  topText: string;
  bottomText: string;
  color: string;
  dateFormat: DateFormat;
  createdAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isFavoriteStamp = (value: unknown): value is FavoriteStamp => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.topText === 'string' &&
    typeof value.bottomText === 'string' &&
    typeof value.color === 'string' &&
    typeof value.dateFormat === 'string' &&
    typeof value.createdAt === 'string'
  );
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const loadFavorites = (): FavoriteStamp[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFavoriteStamp) : [];
  } catch {
    return [];
  }
};

export const saveFavorites = (favorites: FavoriteStamp[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
};

export const createFavorite = (config: StampConfig): FavoriteStamp => {
  const topText = config.topText.trim();
  const bottomText = config.bottomText.trim();
  return {
    id: createId(),
    label: `${topText || '上段'} / ${bottomText || '名前'}`,
    topText,
    bottomText,
    color: config.color,
    dateFormat: config.dateFormat,
    createdAt: new Date().toISOString(),
  };
};
