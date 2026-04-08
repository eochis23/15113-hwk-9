import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InteractionManager,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { PieceGlyphText } from '@/components/piece-glyph';
import { boardPalette } from '@/constants/board-themes';
import { difficultyDepth, pickBestChessMove } from '@/lib/ai/chess-ai';
import { MainChessController, moveToUci } from '@/lib/games/chess-controller';
import type {
  AppearanceSettings,
  CpuDifficulty,
  MoveEntry,
  PlayerKind,
  SavedGameRecord,
  TimeControlId,
} from '@/lib/games/types';
import { getTimeControl } from '@/lib/games/types';
import { gameHistoryStorage } from '@/lib/storage/game-history';

function hapticLight() {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function formatClock(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Props = {
  white: PlayerKind;
  black: PlayerKind;
  cpuDifficulty: CpuDifficulty;
  timeControlId: TimeControlId;
  appearance: AppearanceSettings;
};

/** Standard chess only — other variants will get their own screens later. */
export function GamePlayView({ white, black, cpuDifficulty, timeControlId, appearance }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 360);
  const cell = size / 8;

  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const ctrl = useMemo(() => new MainChessController('standard'), []);

  const [selected, setSelected] = useState<Square | null>(null);
  const savedOnceRef = useRef(false);
  const [moveLog, setMoveLog] = useState<MoveEntry[]>([]);

  const tc = useMemo(() => getTimeControl(timeControlId), [timeControlId]);
  const colors = boardPalette(appearance.boardTheme);

  const [whiteMs, setWhiteMs] = useState(tc.initialMs);
  const [blackMs, setBlackMs] = useState(tc.initialMs);

  useEffect(() => {
    setWhiteMs(tc.initialMs);
    setBlackMs(tc.initialMs);
    savedOnceRef.current = false;
    setMoveLog([]);
    setSelected(null);
    bump();
  }, [tc.initialMs]);

  useEffect(() => {
    if (tc.id === 'unlimited' || tc.initialMs <= 0) return;
    const id = setInterval(() => {
      const turn = ctrl.turn();
      if (turn === 'w') {
        setWhiteMs((ms) => Math.max(0, ms - 100));
      } else {
        setBlackMs((ms) => Math.max(0, ms - 100));
      }
    }, 100);
    return () => clearInterval(id);
  }, [tc.id, tc.initialMs, tick, ctrl]);

  useEffect(() => {
    if (tc.id === 'unlimited' || tc.initialMs <= 0) return;
    if (moveLog.length === 0) return;
    if (whiteMs <= 0) {
      Alert.alert('Time', 'White forfeits on time.', [{ text: 'OK', onPress: () => router.back() }]);
    }
    if (blackMs <= 0) {
      Alert.alert('Time', 'Black forfeits on time.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [whiteMs, blackMs, tc, moveLog.length, router]);

  const playerForSide = useCallback(
    (t: 'w' | 'b'): PlayerKind => (t === 'w' ? white : black),
    [white, black]
  );

  const appendMove = useCallback(
    (san: string, fenAfter: string, uci: string) => {
      setMoveLog((prev) => {
        const next = [...prev, { san, fenAfter, uci }];
        if (tc.incrementMs > 0) {
          const lastMover = next.length % 2 === 1 ? 'w' : 'b';
          if (lastMover === 'w') setWhiteMs((ms) => ms + tc.incrementMs);
          else setBlackMs((ms) => ms + tc.incrementMs);
        }
        return next;
      });
    },
    [tc.incrementMs]
  );

  const saveIfNeeded = useCallback(
    (result: string, moves: MoveEntry[]) => {
      if (savedOnceRef.current) return;
      savedOnceRef.current = true;
      const rec: SavedGameRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        mode: 'standard',
        createdAt: Date.now(),
        result,
        moves,
        review: [],
        whiteLabel: white === 'cpu' ? `CPU (${cpuDifficulty})` : 'Human',
        blackLabel: black === 'cpu' ? `CPU (${cpuDifficulty})` : 'Human',
        timeControlId: tc.id,
      };
      gameHistoryStorage.save(rec);
    },
    [white, black, cpuDifficulty, tc.id]
  );

  useEffect(() => {
    const r = ctrl.result();
    if (r) saveIfNeeded(r, moveLog);
  }, [tick, ctrl, saveIfNeeded, moveLog]);

  const runCpuOnce = useCallback(() => {
    const t = ctrl.turn();
    if (playerForSide(t) !== 'cpu') return;
    const fen = ctrl.fen();
    const depth = difficultyDepth(cpuDifficulty);
    InteractionManager.runAfterInteractions(() => {
      const chess = new Chess(fen);
      const best = pickBestChessMove(chess, depth, false);
      if (!best) return;
      const played = ctrl.tryMove(best.from, best.to, best.promotion);
      if (played) {
        appendMove(played.san, ctrl.fen(), moveToUci(played));
        hapticLight();
        bump();
      }
    });
  }, [ctrl, cpuDifficulty, appendMove, playerForSide]);

  useEffect(() => {
    const t = ctrl.turn();
    if (playerForSide(t) !== 'cpu') return;
    const id = setTimeout(runCpuOnce, 80);
    return () => clearTimeout(id);
  }, [tick, ctrl, runCpuOnce, playerForSide]);

  const files = 'abcdefgh';
  const fen = ctrl.fen();
  const chess = new Chess(fen);

  const legalTo = new Set<string>();
  if (selected) {
    for (const mv of ctrl.legalMovesVerbose()) {
      if (mv.from === selected) legalTo.add(mv.to);
    }
  }

  const onCell = (sq: string) => {
    const st = ctrl.turn();
    if (playerForSide(st) !== 'human') return;

    if (!selected) {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === ctrl.turn()) {
        setSelected(sq as Square);
        hapticLight();
      }
      return;
    }
    const from = selected;
    if (sq === from) {
      setSelected(null);
      hapticLight();
      return;
    }
    const pieceFrom = chess.get(from);
    const needsPromo =
      pieceFrom?.type === 'p' &&
      ((pieceFrom.color === 'w' && sq[1] === '8') || (pieceFrom.color === 'b' && sq[1] === '1'));
    const tryPlay = (promo?: PieceSymbol): boolean => {
      const played: Move | null = ctrl.tryMove(from, sq as Square, promo);
      if (!played) return false;
      appendMove(played.san, ctrl.fen(), moveToUci(played));
      setSelected(null);
      hapticLight();
      bump();
      return true;
    };
    if (needsPromo) {
      Alert.alert('Promotion', 'Choose', [
        { text: 'Queen', onPress: () => tryPlay('q') },
        { text: 'Rook', onPress: () => tryPlay('r') },
        { text: 'Bishop', onPress: () => tryPlay('b') },
        { text: 'Knight', onPress: () => tryPlay('n') },
        { text: 'Cancel', style: 'cancel', onPress: () => setSelected(null) },
      ]);
      return;
    }
    if (!tryPlay()) {
      const p = chess.get(sq as Square);
      if (p && p.color === ctrl.turn()) {
        setSelected(sq as Square);
        hapticLight();
      }
    }
  };

  const rows: { sq: string; light: boolean; piece: ReturnType<Chess['get']> }[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: { sq: string; light: boolean; piece: ReturnType<Chess['get']> }[] = [];
    for (let f = 0; f < 8; f++) {
      const sq = `${files[f]}${8 - r}` as Square;
      const light = (r + f) % 2 === 0;
      row.push({ sq, light, piece: chess.get(sq) });
    }
    rows.push(row);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text selectable style={{ fontSize: 13, opacity: 0.7 }}>
        Standard chess · {white === 'cpu' ? `CPU ${cpuDifficulty}` : 'Human'} vs{' '}
        {black === 'cpu' ? `CPU ${cpuDifficulty}` : 'Human'}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: '#1a1a1e',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
        <View
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 8,
            borderWidth: 3,
            borderColor: ctrl.turn() === 'w' && !ctrl.result() ? '#0a84ff' : 'transparent',
            backgroundColor: ctrl.turn() === 'w' && !ctrl.result() ? '#2a3040' : '#25252c',
            alignItems: 'center',
          }}>
          <Text selectable style={{ color: '#aaa', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
            White
          </Text>
          <Text
            selectable
            style={{
              color: '#fff',
              fontSize: 26,
              fontWeight: '700',
              fontVariant: ['tabular-nums'],
            }}>
            {tc.id === 'unlimited' ? '∞' : formatClock(whiteMs)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 8,
            borderWidth: 3,
            borderColor: ctrl.turn() === 'b' && !ctrl.result() ? '#0a84ff' : 'transparent',
            backgroundColor: ctrl.turn() === 'b' && !ctrl.result() ? '#2a3040' : '#25252c',
            alignItems: 'center',
          }}>
          <Text selectable style={{ color: '#aaa', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
            Black
          </Text>
          <Text
            selectable
            style={{
              color: '#fff',
              fontSize: 26,
              fontWeight: '700',
              fontVariant: ['tabular-nums'],
            }}>
            {tc.id === 'unlimited' ? '∞' : formatClock(blackMs)}
          </Text>
        </View>
      </View>
      <View style={{ width: size, height: size }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', height: cell }}>
            {row.map((cellObj) => {
              const bg = cellObj.light ? colors.light : colors.dark;
              const hi = selected === cellObj.sq || legalTo.has(cellObj.sq);
              return (
                <Pressable
                  key={cellObj.sq}
                  onPress={() => onCell(cellObj.sq)}
                  style={{
                    width: cell,
                    height: cell,
                    backgroundColor: bg,
                    borderWidth: hi ? 2 : 0,
                    borderColor: '#0a84ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {cellObj.piece ? (
                    <PieceGlyphText
                      type={cellObj.piece.type}
                      color={cellObj.piece.color}
                      theme={appearance.pieceTheme}
                      interactive={false}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Text selectable style={{ fontWeight: '600' }}>
        Moves
      </Text>
      <View style={{ gap: 4, maxHeight: 160 }}>
        {Array.from({ length: Math.ceil(moveLog.length / 2) }, (_, i) => {
          const a = moveLog[i * 2]?.san;
          const b = moveLog[i * 2 + 1]?.san;
          return (
            <Text key={i} selectable>
              {i + 1}. {a}
              {b ? ` ${b}` : ''}
            </Text>
          );
        })}
      </View>
      {ctrl.result() ? (
        <Text selectable style={{ fontSize: 18, fontWeight: '700' }}>
          Result: {ctrl.result()}
        </Text>
      ) : null}
    </ScrollView>
  );
}
