import type { SavedGameRecord } from '@/lib/games/types';

const KEY = 'board-games:history:v1';

function readAll(): SavedGameRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedGameRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: SavedGameRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export const gameHistoryStorage = {
  list(): SavedGameRecord[] {
    return readAll().sort((a, b) => b.createdAt - a.createdAt);
  },

  save(record: SavedGameRecord) {
    const all = readAll();
    all.unshift(record);
    writeAll(all.slice(0, 200));
  },

  get(id: string): SavedGameRecord | undefined {
    return readAll().find((r) => r.id === id);
  },
};
