import type { PieceThemeId } from '@/lib/games/types';
import { Text, type TextStyle } from 'react-native';

const UNICODE: Record<string, { w: string; b: string }> = {
  p: { w: '♙', b: '♟' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  r: { w: '♖', b: '♜' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

const LETTERS: Record<string, { w: string; b: string }> = {
  p: { w: 'P', b: 'p' },
  n: { w: 'N', b: 'n' },
  b: { w: 'B', b: 'b' },
  r: { w: 'R', b: 'r' },
  q: { w: 'Q', b: 'q' },
  k: { w: 'K', b: 'k' },
};

export function pieceGlyph(
  type: string,
  color: 'w' | 'b',
  theme: PieceThemeId
): string {
  const t = type.toLowerCase();
  if (theme === 'letter' || theme === 'minimal') {
    return LETTERS[t]?.[color] ?? '?';
  }
  return UNICODE[t]?.[color] ?? '?';
}

export function PieceGlyphText({
  type,
  color,
  theme,
  style,
  /** When false, touches pass through to parent (e.g. board Pressable). `selectable` steals taps on iOS. */
  interactive = true,
}: {
  type: string;
  color: 'w' | 'b';
  theme: PieceThemeId;
  style?: TextStyle;
  interactive?: boolean;
}) {
  const ch = pieceGlyph(type, color, theme);
  return (
    <Text
      selectable={interactive}
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[{ fontSize: theme === 'minimal' ? 20 : 28 }, style]}>
      {ch}
    </Text>
  );
}
