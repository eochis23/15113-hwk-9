export type GameMode = 'standard' | 'crazyhouse' | 'atomic' | 'duck' | 'checkers';

export type PlayerKind = 'human' | 'cpu';

export type CpuDifficulty = 'easy' | 'medium' | 'hard';

export type TimeControlId = '1+1' | '3+2' | '5+0' | '10+0' | '15+10' | '30+0' | 'unlimited';

export type BoardThemeId = 'classic' | 'green' | 'blue' | 'gray';

export type PieceThemeId = 'unicode' | 'letter' | 'minimal';

export interface TimeControl {
  id: TimeControlId;
  label: string;
  initialMs: number;
  incrementMs: number;
}

export const TIME_CONTROLS: TimeControl[] = [
  { id: '1+1', label: '1+1 (1 min + 1s)', initialMs: 60_000, incrementMs: 1000 },
  { id: '3+2', label: '3+2 (3 min + 2s)', initialMs: 180_000, incrementMs: 2000 },
  { id: '5+0', label: '5+0 (5 min)', initialMs: 300_000, incrementMs: 0 },
  { id: '10+0', label: '10+0 (10 min)', initialMs: 600_000, incrementMs: 0 },
  { id: '15+10', label: '15+10 (15 min + 10s)', initialMs: 900_000, incrementMs: 10_000 },
  { id: '30+0', label: '30+0 (30 min)', initialMs: 1_800_000, incrementMs: 0 },
  { id: 'unlimited', label: 'Unlimited', initialMs: 0, incrementMs: 0 },
];

export function getTimeControl(id: TimeControlId): TimeControl {
  return TIME_CONTROLS.find((t) => t.id === id) ?? TIME_CONTROLS[TIME_CONTROLS.length - 1]!;
}

export type Color = 'w' | 'b';

export interface MoveEntry {
  san: string;
  uci: string;
  fenAfter: string;
}

export interface ReviewEntry {
  plyIndex: number;
  playedSan: string;
  suggestedSan: string;
  note: string;
}

export interface SavedGameRecord {
  id: string;
  mode: GameMode;
  createdAt: number;
  result: string;
  moves: MoveEntry[];
  review: ReviewEntry[];
  whiteLabel: string;
  blackLabel: string;
  timeControlId: TimeControlId;
}

export interface AppearanceSettings {
  boardTheme: BoardThemeId;
  pieceTheme: PieceThemeId;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  boardTheme: 'classic',
  pieceTheme: 'unicode',
};
