import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

export type CrazyhouseMove =
  | { kind: 'normal'; from: Square; to: Square; promotion?: PieceSymbol }
  | { kind: 'drop'; piece: PieceSymbol; to: Square };

export class CrazyhouseController {
  private chess: Chess;
  pockets: { w: PieceSymbol[]; b: PieceSymbol[] };

  constructor() {
    this.chess = new Chess();
    this.pockets = { w: [], b: [] };
  }

  fen(): string {
    return this.chess.fen();
  }

  turn(): Color {
    return this.chess.turn();
  }

  board() {
    return this.chess.board();
  }

  inCheck(): boolean {
    return this.chess.inCheck();
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  result(): string | null {
    if (this.chess.isCheckmate()) return this.chess.turn() === 'w' ? '0-1' : '1-0';
    if (this.chess.isDraw()) return '1/2-1/2';
    return null;
  }

  historySan(): string[] {
    return this.chess.history();
  }

  legalMoves(): CrazyhouseMove[] {
    const out: CrazyhouseMove[] = [];
    const turn = this.chess.turn();
    const verbose = this.chess.moves({ verbose: true }) as Move[];
    for (const m of verbose) {
      out.push({
        kind: 'normal',
        from: m.from,
        to: m.to,
        promotion: m.promotion,
      });
    }
    const pocket = this.pockets[turn];
    const counts = new Map<PieceSymbol, number>();
    for (const p of pocket) {
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    const files = 'abcdefgh';
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = `${files[f]}${r + 1}` as Square;
        if (this.chess.get(sq)) continue;
        for (const [piece, n] of counts) {
          if (n <= 0) continue;
          if (piece === 'p' && (r === 0 || r === 7)) continue;
          if (!this.tryDropPreview(piece, sq, turn)) continue;
          out.push({ kind: 'drop', piece, to: sq });
        }
      }
    }
    return out;
  }

  private tryDropPreview(piece: PieceSymbol, sq: Square, color: Color): boolean {
    const ok = this.chess.put({ type: piece, color }, sq);
    if (!ok) return false;
    const bad = this.chess.inCheck();
    this.chess.remove(sq);
    return !bad;
  }

  apply(cm: CrazyhouseMove): boolean {
    const turn = this.chess.turn();
    if (cm.kind === 'drop') {
      const idx = this.pockets[turn].indexOf(cm.piece);
      if (idx < 0) return false;
      if (this.chess.get(cm.to)) return false;
      if (cm.piece === 'p' && (cm.to[1] === '1' || cm.to[1] === '8')) return false;
      this.pockets[turn].splice(idx, 1);
      this.chess.put({ type: cm.piece, color: turn }, cm.to);
      if (this.chess.inCheck()) {
        this.chess.remove(cm.to);
        this.pockets[turn].push(cm.piece);
        return false;
      }
      this.chess.setTurn(turn === 'w' ? 'b' : 'w');
      return true;
    }
    const m = this.chess.move({
      from: cm.from,
      to: cm.to,
      promotion: cm.promotion,
    });
    if (!m) return false;
    if (m.captured) {
      const t = m.captured as PieceSymbol;
      if (t !== 'k') {
        this.pockets[turn].push(t);
      }
    }
    return true;
  }

  sanForLast(): string {
    const h = this.chess.history({ verbose: true }) as Move[];
    const last = h[h.length - 1];
    return last?.san ?? '';
  }

  /** Deep copy for AI search (no undo stack). */
  clone(): CrazyhouseController {
    const c = new CrazyhouseController();
    c.chess.load(this.chess.fen());
    c.pockets = { w: [...this.pockets.w], b: [...this.pockets.b] };
    return c;
  }
}

export function crazyhouseMoveKey(m: CrazyhouseMove): string {
  if (m.kind === 'drop') return `drop:${m.piece}@${m.to}`;
  return `mv:${m.from}${m.to}${m.promotion ?? ''}`;
}
