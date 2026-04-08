import { Chess } from 'chess.js';

import { reviewStandardMove } from '@/lib/ai/review';
import type { ReviewEntry, SavedGameRecord } from '@/lib/games/types';

/** Replays a saved standard game and builds review hints only for human moves (CPU lines). */
export function computeStandardGameReview(rec: SavedGameRecord): ReviewEntry[] {
  if (rec.mode !== 'standard') return [];

  const whiteHuman = rec.whiteLabel === 'Human';
  const blackHuman = rec.blackLabel === 'Human';
  if (!whiteHuman && !blackHuman) return [];

  const chess = new Chess();
  const out: ReviewEntry[] = [];

  for (let i = 0; i < rec.moves.length; i++) {
    const fenBefore = chess.fen();
    const sideToMove = chess.turn();
    const played = chess.move(rec.moves[i]!.san);
    if (!played) break;

    const humanPlayed =
      (sideToMove === 'w' && whiteHuman) || (sideToMove === 'b' && blackHuman);
    if (humanPlayed) {
      const hint = reviewStandardMove(fenBefore, played, false);
      if (hint) {
        out.push({
          plyIndex: i,
          playedSan: played.san,
          suggestedSan: hint.suggestedSan,
          note: hint.note,
        });
      }
    }
  }

  return out;
}
