export type CheckersCell = '.' | 'w' | 'W' | 'b' | 'B';

export type CheckersPos = { r: number; c: number };

export type CheckersStep = {
  from: CheckersPos;
  to: CheckersPos;
  captures: CheckersPos[];
};

const ALL_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

function playable(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8 && (r + c) % 2 === 1;
}

function cloneGrid(g: CheckersCell[][]): CheckersCell[][] {
  return g.map((row) => [...row]);
}

export class CheckersEngine {
  grid: CheckersCell[][];
  turn: 'w' | 'b';

  constructor() {
    this.grid = Array.from({ length: 8 }, () => Array<CheckersCell>(8).fill('.'));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!playable(r, c)) continue;
        if (r < 3) this.grid[r]![c] = 'b';
        else if (r > 4) this.grid[r]![c] = 'w';
      }
    }
    this.turn = 'b';
  }

  static fromGrid(grid: CheckersCell[][], turn: 'w' | 'b') {
    const e = new CheckersEngine();
    e.grid = cloneGrid(grid);
    e.turn = turn;
    return e;
  }

  copy(): CheckersEngine {
    return CheckersEngine.fromGrid(this.grid, this.turn);
  }

  legalSteps(): CheckersStep[] {
    const jumps: CheckersStep[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!this.owned(this.grid[r]![c]!)) continue;
        jumps.push(...this.jumpsFrom(r, c));
      }
    }
    if (jumps.length > 0) return jumps;
    const quiet: CheckersStep[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!this.owned(this.grid[r]![c]!)) continue;
        quiet.push(...this.quietFrom(r, c));
      }
    }
    return quiet;
  }

  private quietFrom(r: number, c: number): CheckersStep[] {
    const cell = this.grid[r]![c]!;
    const out: CheckersStep[] = [];
    for (const [dr, dc] of this.dirsFor(cell)) {
      const nr = r + dr;
      const nc = c + dc;
      if (!playable(nr, nc) || this.grid[nr]![nc] !== '.') continue;
      out.push({ from: { r, c }, to: { r: nr, c: nc }, captures: [] });
    }
    return out;
  }

  private jumpsFrom(sr: number, sc: number): CheckersStep[] {
    const startPiece = this.grid[sr]![sc]!;
    const results: CheckersStep[] = [];

    const dfs = (g: CheckersCell[][], cr: number, cc: number, caps: CheckersPos[], working: CheckersCell) => {
      let extended = false;
      for (const [dr, dc] of this.dirsFor(working)) {
        const mr = cr + dr;
        const mc = cc + dc;
        const jr = cr + 2 * dr;
        const jc = cc + 2 * dc;
        if (!playable(jr, jc)) continue;
        const mid = g[mr]![mc]!;
        if (mid === '.' || !this.enemy(mid)) continue;
        if (g[jr]![jc] !== '.') continue;
        if (caps.some((p) => p.r === mr && p.c === mc)) continue;
        const ng = cloneGrid(g);
        ng[cr]![cc] = '.';
        ng[mr]![mc] = '.';
        const landed = this.promotePiece(working, jr);
        ng[jr]![jc] = landed;
        dfs(ng, jr, jc, [...caps, { r: mr, c: mc }], landed);
        extended = true;
      }
      if (!extended && caps.length > 0) {
        results.push({ from: { r: sr, c: sc }, to: { r: cr, c: cc }, captures: caps });
      }
    };

    dfs(cloneGrid(this.grid), sr, sc, [], startPiece);
    return results;
  }

  private promotePiece(p: CheckersCell, row: number): CheckersCell {
    if (p === 'w' && row === 0) return 'W';
    if (p === 'b' && row === 7) return 'B';
    return p;
  }

  private owned(cell: CheckersCell): boolean {
    if (this.turn === 'w') return cell === 'w' || cell === 'W';
    return cell === 'b' || cell === 'B';
  }

  private enemy(cell: CheckersCell): boolean {
    if (this.turn === 'w') return cell === 'b' || cell === 'B';
    return cell === 'w' || cell === 'W';
  }

  private dirsFor(cell: CheckersCell): readonly (readonly [number, number])[] {
    if (cell === 'w') return [[-1, -1], [-1, 1]];
    if (cell === 'b') return [[1, -1], [1, 1]];
    return ALL_DIRS;
  }

  apply(step: CheckersStep): boolean {
    const legal = this.legalSteps();
    const match = legal.find(
      (s) =>
        s.from.r === step.from.r &&
        s.from.c === step.from.c &&
        s.to.r === step.to.r &&
        s.to.c === step.to.c &&
        s.captures.length === step.captures.length &&
        s.captures.every(
          (p, i) => p.r === step.captures[i]!.r && p.c === step.captures[i]!.c
        )
    );
    if (!match) return false;
    const piece = this.grid[match.from.r]![match.from.c]!;
    this.grid[match.from.r]![match.from.c] = '.';
    for (const cap of match.captures) {
      this.grid[cap.r]![cap.c] = '.';
    }
    const finalRow = match.to.r;
    this.grid[finalRow]![match.to.c] = this.kingAfterMove(piece, finalRow);
    this.turn = this.turn === 'w' ? 'b' : 'w';
    return true;
  }

  private kingAfterMove(p: CheckersCell, row: number): CheckersCell {
    if (p === 'w' && row === 0) return 'W';
    if (p === 'b' && row === 7) return 'B';
    return p;
  }

  result(): string | null {
    if (this.legalSteps().length === 0) {
      return this.turn === 'w' ? '0-1' : '1-0';
    }
    const wb = this.count('w') + this.count('W');
    const bb = this.count('b') + this.count('B');
    if (wb === 0) return '0-1';
    if (bb === 0) return '1-0';
    return null;
  }

  private count(kind: CheckersCell): number {
    let n = 0;
    for (const row of this.grid) {
      for (const c of row) {
        if (c === kind) n++;
      }
    }
    return n;
  }
}

export function stepKey(s: CheckersStep): string {
  return `${s.from.r},${s.from.c}->${s.to.r},${s.to.c}:${s.captures.map((p) => `${p.r},${p.c}`).join(';')}`;
}
