const FILES = 'abcdefgh';

export type Square = `${string}`;

export function parseSquare(sq: string): { file: number; rank: number } {
  const file = FILES.indexOf(sq[0] ?? 'a');
  const rank = parseInt(sq[1] ?? '1', 10);
  return { file, rank: rank - 1 };
}

export function toSquare(file: number, rank: number): string {
  return `${FILES[file]}${rank + 1}`;
}

export function squaresBetween(from: string, to: string): string[] {
  const a = parseSquare(from);
  const b = parseSquare(to);
  const df = b.file - a.file;
  const dr = b.rank - a.rank;
  const sf = Math.sign(df);
  const sr = Math.sign(dr);
  if (df === 0 && dr === 0) return [];
  if (sf !== 0 && sr !== 0 && Math.abs(df) !== Math.abs(dr)) return [];
  if (sf === 0 && sr === 0) return [];
  const out: string[] = [];
  let f = a.file + sf;
  let r = a.rank + sr;
  while (f !== b.file || r !== b.rank) {
    out.push(toSquare(f, r));
    f += sf;
    r += sr;
  }
  return out;
}

export function neighbors8(sq: string): string[] {
  const { file, rank } = parseSquare(sq);
  const out: string[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = file + df;
      const nr = rank + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
        out.push(toSquare(nf, nr));
      }
    }
  }
  return out;
}

export function neighbors9(sq: string): string[] {
  return [sq, ...neighbors8(sq)];
}

export function isKnightMove(from: string, to: string): boolean {
  const a = parseSquare(from);
  const b = parseSquare(to);
  const df = Math.abs(a.file - b.file);
  const dr = Math.abs(a.rank - b.rank);
  return (df === 2 && dr === 1) || (df === 1 && dr === 2);
}
