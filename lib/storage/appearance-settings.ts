import type { AppearanceSettings } from '@/lib/games/types';
import { DEFAULT_APPEARANCE } from '@/lib/games/types';

const KEY = 'board-games:appearance:v1';

export function loadAppearance(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const v = JSON.parse(raw) as Partial<AppearanceSettings>;
    return {
      boardTheme: v.boardTheme ?? DEFAULT_APPEARANCE.boardTheme,
      pieceTheme: v.pieceTheme ?? DEFAULT_APPEARANCE.pieceTheme,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(s: AppearanceSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
