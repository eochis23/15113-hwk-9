import type { CrazyhouseController, CrazyhouseMove } from '@/lib/games/crazyhouse-controller';

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function material(c: CrazyhouseController, forColor: 'w' | 'b'): number {
  let s = 0;
  const board = c.board();
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const v = VAL[cell.type] ?? 0;
      s += cell.color === forColor ? v : -v;
    }
  }
  for (const p of c.pockets[forColor]) {
    s += VAL[p] ?? 0;
  }
  for (const p of c.pockets[forColor === 'w' ? 'b' : 'w']) {
    s -= VAL[p] ?? 0;
  }
  return s;
}

export function pickCrazyhouseMove(
  ctrl: CrazyhouseController,
  d: 'easy' | 'medium' | 'hard'
): CrazyhouseMove | null {
  const leg = ctrl.legalMoves();
  if (leg.length === 0) return null;
  if (d === 'easy' && Math.random() < 0.45) {
    return leg[Math.floor(Math.random() * leg.length)]!;
  }
  const me = ctrl.turn();
  const depth = d === 'hard' ? 2 : 1;

  const negamax = (c: CrazyhouseController, plies: number, a: number, b: number): number => {
    if (plies === 0) return material(c, c.turn());
    const ms = c.legalMoves();
    if (ms.length === 0) {
      return c.inCheck() ? -1e5 : 0;
    }
    let best = -1e9;
    for (const m of ms) {
      const x = c.clone();
      if (!x.apply(m)) continue;
      const sc = -negamax(x, plies - 1, -b, -a);
      if (sc > best) best = sc;
      if (best > a) a = best;
      if (a >= b) break;
    }
    return best;
  };

  let bestM: CrazyhouseMove = leg[0]!;
  let bestSc = -1e12;
  for (const m of leg) {
    const x = ctrl.clone();
    if (!x.apply(m)) continue;
    const sc = -negamax(x, depth - 1, -1e9, 1e9);
    if (sc > bestSc) {
      bestSc = sc;
      bestM = m;
    }
  }
  return bestM;
}
