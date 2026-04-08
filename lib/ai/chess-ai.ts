import { Chess, type Move, type Square } from 'chess.js';

import { neighbors8 } from '@/lib/games/square-utils';

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

/** Positive when good for the side to move. */
function staticEval(chess: Chess): number {
  const me = chess.turn();
  let s = 0;
  const files = 'abcdefgh';
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${files[f]}${r + 1}` as Square;
      const p = chess.get(sq);
      if (!p) continue;
      const v = VAL[p.type] ?? 0;
      s += p.color === me ? v : -v;
    }
  }
  return s;
}

function applyAtomicCapture(chess: Chess, m: Move) {
  if (!m.captured) return;
  const center = m.to as Square;
  chess.remove(center);
  for (const sq of neighbors8(center)) {
    const p = chess.get(sq as Square);
    if (p && p.type !== 'p') {
      chess.remove(sq as Square);
    }
  }
}

function applyMove(chess: Chess, m: Move, atomic: boolean): boolean {
  const done = chess.move({
    from: m.from,
    to: m.to,
    promotion: m.promotion,
  });
  if (!done) return false;
  if (atomic && done.captured) {
    applyAtomicCapture(chess, done);
  }
  return true;
}

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  atomic: boolean
): number {
  if (depth === 0) return staticEval(chess);
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) {
    if (chess.inCheck()) return -1e6;
    return 0;
  }
  let best = -1e9;
  for (const m of moves) {
    const snap = chess.fen();
    if (!applyMove(chess, m, atomic)) continue;
    const wk = chess.findPiece({ type: 'k', color: 'w' });
    const bk = chess.findPiece({ type: 'k', color: 'b' });
    let sc: number;
    if (atomic && (wk.length === 0 || bk.length === 0)) {
      sc = wk.length === 0 && bk.length === 0 ? 0 : wk.length === 0 ? -1e6 : 1e6;
    } else {
      sc = -negamax(chess, depth - 1, -beta, -alpha, atomic);
    }
    chess.load(snap);
    if (sc > best) best = sc;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export function pickBestChessMove(chess: Chess, depth: number, atomic: boolean): Move | null {
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;
  let best: Move | null = null;
  let bestScore = -1e10;
  for (const m of moves) {
    const snap = chess.fen();
    if (!applyMove(chess, m, atomic)) continue;
    const wk = chess.findPiece({ type: 'k', color: 'w' });
    const bk = chess.findPiece({ type: 'k', color: 'b' });
    let sc: number;
    if (atomic && (wk.length === 0 || bk.length === 0)) {
      sc = wk.length === 0 && bk.length === 0 ? 0 : wk.length === 0 ? -1e6 : 1e6;
    } else {
      sc = -negamax(chess, depth - 1, -1e9, 1e9, atomic);
    }
    chess.load(snap);
    if (sc > bestScore) {
      bestScore = sc;
      best = m;
    }
  }
  return best;
}

export function difficultyDepth(d: 'easy' | 'medium' | 'hard'): number {
  if (d === 'easy') return 2;
  if (d === 'medium') return 3;
  return 4;
}
