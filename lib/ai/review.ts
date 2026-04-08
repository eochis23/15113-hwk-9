import { Chess, type Move } from 'chess.js';

import { pickBestChessMove } from '@/lib/ai/chess-ai';

export function reviewStandardMove(
  fenBefore: string,
  played: Move,
  atomic: boolean
): { suggestedSan: string; note: string } | null {
  const chess = new Chess(fenBefore);
  const best = pickBestChessMove(chess, 3, atomic);
  if (!best) return null;
  if (
    best.from === played.from &&
    best.to === played.to &&
    (best.promotion ?? '') === (played.promotion ?? '')
  ) {
    return null;
  }
  return {
    suggestedSan: best.san,
    note: `Engine prefers ${best.san} in this position.`,
  };
}
