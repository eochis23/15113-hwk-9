import type { BoardThemeId } from '@/lib/games/types';

export function boardPalette(id: BoardThemeId): { light: string; dark: string } {
  switch (id) {
    case 'green':
      return { light: '#ebecd0', dark: '#739552' };
    case 'blue':
      return { light: '#dee3f0', dark: '#4a6fa5' };
    case 'gray':
      return { light: '#e8e8e8', dark: '#9e9e9e' };
    default:
      return { light: '#f0d9b5', dark: '#b58863' };
  }
}
