import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

import { neighbors8, squaresBetween } from '@/lib/games/square-utils';

export type MainVariant = 'standard' | 'atomic' | 'duck';

export type Phase = 'piece' | 'duck';

export class MainChessController {
  private chess: Chess;
  readonly variant: MainVariant;
  private duckSquare: Square | null;
  phase: Phase;
  private duckMover: Color | null;

  constructor(variant: MainVariant) {
    this.variant = variant;
    this.chess = new Chess();
    this.duckSquare = variant === 'duck' ? ('d4' as Square) : null;
    this.phase = 'piece';
    this.duckMover = null;
  }

  loadFen(fen: string) {
    this.chess.load(fen);
    if (this.variant === 'duck' && !this.duckSquare) {
      this.duckSquare = 'd4' as Square;
    }
  }

  fen(): string {
    return this.chess.fen();
  }

  turn(): Color {
    return this.chess.turn();
  }

  duck(): Square | null {
    return this.duckSquare;
  }

  /** Side that must place the duck (duck variant, duck phase). */
  getDuckMover(): Color | null {
    return this.duckMover;
  }

  inCheck(): boolean {
    return this.chess.inCheck();
  }

  isGameOver(): boolean {
    return this.chess.isGameOver() || this.atomicMissingKing();
  }

  result(): string | null {
    if (this.atomicMissingKing()) {
      const wk = this.chess.findPiece({ type: 'k', color: 'w' });
      const bk = this.chess.findPiece({ type: 'k', color: 'b' });
      if (wk.length === 0 && bk.length === 0) return '1/2-1/2';
      if (wk.length === 0) return '0-1';
      if (bk.length === 0) return '1-0';
    }
    if (this.chess.isCheckmate()) return this.chess.turn() === 'w' ? '0-1' : '1-0';
    if (this.chess.isDraw()) return '1/2-1/2';
    return null;
  }

  private atomicMissingKing(): boolean {
    if (this.variant !== 'atomic') return false;
    const wk = this.chess.findPiece({ type: 'k', color: 'w' });
    const bk = this.chess.findPiece({ type: 'k', color: 'b' });
    return wk.length === 0 || bk.length === 0;
  }

  historySan(): string[] {
    return this.chess.history();
  }

  board() {
    return this.chess.board();
  }

  legalMovesVerbose(): Move[] {
    if (this.variant !== 'duck' || !this.duckSquare) {
      return this.chess.moves({ verbose: true }) as Move[];
    }
    const d = this.duckSquare;
    const all = this.chess.moves({ verbose: true }) as Move[];
    return all.filter((m) => this.isDuckCompatibleMove(m, d));
  }

  private isDuckCompatibleMove(m: Move, d: Square): boolean {
    if (m.to === d) return false;
    const piece = this.chess.get(m.from);
    if (!piece) return false;
    if (piece.type === 'n') return true;
    const between = squaresBetween(m.from, m.to);
    return !between.includes(d);
  }

  /** Valid empty squares to place the duck (duck variant, piece phase just ended). */
  duckPlacementSquares(): Square[] {
    if (this.variant !== 'duck' || this.phase !== 'duck' || !this.duckMover) return [];
    const out: Square[] = [];
    const files = 'abcdefgh';
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = `${files[f]}${r + 1}` as Square;
        if (this.chess.get(sq)) continue;
        if (sq === this.duckSquare) continue;
        out.push(sq);
      }
    }
    return out;
  }

  tryMove(from: Square, to: Square, promotion?: PieceSymbol): Move | null {
    if (this.variant === 'duck' && this.phase === 'duck') {
      return null;
    }
    const moves = this.legalMovesVerbose().filter((m) => m.from === from && m.to === to);
    if (moves.length === 0) return null;
    const pick =
      moves.find((m) => (promotion ? m.promotion === promotion : !m.promotion)) ?? moves[0]!;
    return this.applyChosenMove(pick);
  }

  tryDuckMove(to: Square): boolean {
    if (this.variant !== 'duck' || this.phase !== 'duck') return false;
    if (this.chess.get(to)) return false;
    if (to === this.duckSquare) return false;
    this.duckSquare = to;
    this.phase = 'piece';
    this.duckMover = null;
    return true;
  }

  private applyChosenMove(m: Move): Move | null {
    const executed = this.chess.move({
      from: m.from,
      to: m.to,
      promotion: m.promotion,
    });
    if (!executed) return null;
    if (this.variant === 'atomic' && executed.captured) {
      this.applyAtomicBlast(executed.to as Square);
    }
    if (this.variant === 'duck') {
      this.phase = 'duck';
      this.duckMover = executed.color;
    }
    return executed;
  }

  private applyAtomicBlast(center: Square) {
    this.chess.remove(center);
    for (const sq of neighbors8(center)) {
      const p = this.chess.get(sq as Square);
      if (p && p.type !== 'p') {
        this.chess.remove(sq as Square);
      }
    }
  }

  /** Apply move for AI / search — caller manages undo stack via chess.undo(). */
  applyMoveForSearch(m: { from: Square; to: Square; promotion?: PieceSymbol }): Move | null {
    const verbose = this.legalMovesVerbose().find(
      (x) => x.from === m.from && x.to === m.to && (m.promotion ? x.promotion === m.promotion : !x.promotion)
    );
    if (!verbose) return null;
    return this.applyChosenMove(verbose);
  }

  undo(): Move | null {
    const u = this.chess.undo();
    if (this.variant === 'duck') {
      this.phase = 'piece';
      this.duckMover = null;
    }
    return u;
  }

  clone(): MainChessController {
    const c = new MainChessController(this.variant);
    c.chess.load(this.chess.fen());
    c.duckSquare = this.duckSquare;
    c.phase = this.phase;
    c.duckMover = this.duckMover;
    return c;
  }

  static fromFen(variant: MainVariant, fen: string): MainChessController {
    const c = new MainChessController(variant);
    c.chess.load(fen);
    return c;
  }
}

export function moveToUci(m: Move): string {
  let u = m.from + m.to;
  if (m.promotion) u += m.promotion;
  return u;
}
