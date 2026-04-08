import { CheckersEngine, type CheckersStep } from '@/lib/games/checkers-engine';

function mobilityForTurn(e: CheckersEngine): number {
  return e.legalSteps().length;
}

/** Positive = good for side to move. */
function evaluateForMover(e: CheckersEngine): number {
  const me = e.turn;
  let s = 0;
  for (const row of e.grid) {
    for (const c of row) {
      if (me === 'w') {
        if (c === 'w') s += 3;
        if (c === 'W') s += 5;
        if (c === 'b') s -= 3;
        if (c === 'B') s -= 5;
      } else {
        if (c === 'b') s += 3;
        if (c === 'B') s += 5;
        if (c === 'w') s -= 3;
        if (c === 'W') s -= 5;
      }
    }
  }
  return s + mobilityForTurn(e) * 0.1;
}

function negamax(e: CheckersEngine, depth: number, alpha: number, beta: number): number {
  if (depth === 0) return evaluateForMover(e);
  const moves = e.legalSteps();
  if (moves.length === 0) {
    return -5000;
  }
  let best = -1e9;
  for (const m of moves) {
    const copy = e.copy();
    copy.apply(m);
    const sc = -negamax(copy, depth - 1, -beta, -alpha);
    if (sc > best) best = sc;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export function pickBestCheckersMove(e: CheckersEngine, depth: number): CheckersStep | null {
  const moves = e.legalSteps();
  if (moves.length === 0) return null;
  let best: CheckersStep | null = null;
  let bestScore = -1e10;
  for (const m of moves) {
    const copy = e.copy();
    copy.apply(m);
    const sc = -negamax(copy, depth - 1, -1e9, 1e9);
    if (sc > bestScore) {
      bestScore = sc;
      best = m;
    }
  }
  return best;
}

export function randomCheckersMove(e: CheckersEngine): CheckersStep | null {
  const m = e.legalSteps();
  if (m.length === 0) return null;
  return m[Math.floor(Math.random() * m.length)]!;
}

export function pickCheckersMoveForDifficulty(
  e: CheckersEngine,
  d: 'easy' | 'medium' | 'hard'
): CheckersStep | null {
  const depth = d === 'easy' ? 2 : d === 'medium' ? 3 : 4;
  if (d === 'easy' && Math.random() < 0.35) {
    return randomCheckersMove(e);
  }
  return pickBestCheckersMove(e, depth);
}
