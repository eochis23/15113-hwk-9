import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InteractionManager,
  Modal,
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

type GameOverInfo = { title: string; message: string; result: string };

function describeChessEnd(result: string, chess: Chess): GameOverInfo {
  if (result === '1-0') {
    return {
      title: 'White wins',
      message: chess.isCheckmate() ? 'Checkmate.' : 'Game over.',
      result: '1-0',
    };
  }
  if (result === '0-1') {
    return {
      title: 'Black wins',
      message: chess.isCheckmate() ? 'Checkmate.' : 'Game over.',
      result: '0-1',
    };
  }
  let message = 'Draw.';
  if (chess.isStalemate()) message = 'Stalemate — the player to move has no legal moves.';
  else if (chess.isInsufficientMaterial()) message = 'Draw by insufficient material.';
  else if (chess.isThreefoldRepetition()) message = 'Draw by threefold repetition.';
  else message = 'Draw (fifty-move rule or agreement).';
  return { title: 'Draw', message, result: '1/2-1/2' };
}

function timeForfeitInfo(loser: 'w' | 'b'): GameOverInfo {
  if (loser === 'w') {
    return { title: 'Black wins', message: 'White ran out of time.', result: '0-1' };
  }
  return { title: 'White wins', message: 'Black ran out of time.', result: '1-0' };
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
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const gameOverRef = useRef<GameOverInfo | null>(null);
  gameOverRef.current = gameOver;

  useEffect(() => {
    setWhiteMs(tc.initialMs);
    setBlackMs(tc.initialMs);
    savedOnceRef.current = false;
    setMoveLog([]);
    setSelected(null);
    setGameOver(null);
    bump();
  }, [tc.initialMs]);

  useEffect(() => {
    if (tc.id === 'unlimited' || tc.initialMs <= 0) return;
    if (gameOver) return;
    let lastAt = Date.now();
    const id = setInterval(() => {
      if (gameOverRef.current || ctrl.result()) return;
      const now = Date.now();
      const dt = now - lastAt;
      lastAt = now;
      const turn = ctrl.turn();
      if (turn === 'w') {
        setWhiteMs((ms) => Math.max(0, ms - dt));
      } else {
        setBlackMs((ms) => Math.max(0, ms - dt));
      }
    }, 100);
    return () => clearInterval(id);
  }, [tc.id, tc.initialMs, ctrl, gameOver]);

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
    if (gameOver) return;
    if (tc.id === 'unlimited' || tc.initialMs <= 0) return;
    if (whiteMs <= 0) {
      const info = timeForfeitInfo('w');
      setGameOver(info);
      saveIfNeeded(info.result, moveLog);
    } else if (blackMs <= 0) {
      const info = timeForfeitInfo('b');
      setGameOver(info);
      saveIfNeeded(info.result, moveLog);
    }
  }, [whiteMs, blackMs, tc, moveLog, gameOver, saveIfNeeded]);

  useEffect(() => {
    if (gameOver) return;
    const r = ctrl.result();
    if (!r) return;
    const chess = new Chess(ctrl.fen());
    const info = describeChessEnd(r, chess);
    setGameOver(info);
    saveIfNeeded(r, moveLog);
  }, [tick, ctrl, moveLog, gameOver, saveIfNeeded]);

  const runCpuOnce = useCallback(() => {
    const t = ctrl.turn();
    if (playerForSide(t) !== 'cpu') return;
    const fen = ctrl.fen();
    const depth = difficultyDepth(cpuDifficulty);
    InteractionManager.runAfterInteractions(() => {
      if (gameOverRef.current) return;
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
    if (gameOver) return;
    const t = ctrl.turn();
    if (playerForSide(t) !== 'cpu') return;
    const id = setTimeout(runCpuOnce, 80);
    return () => clearTimeout(id);
  }, [tick, ctrl, runCpuOnce, playerForSide, gameOver]);

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
    if (gameOver) return;
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
    <View style={{ flex: 1 }}>
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
    </ScrollView>
    <Modal visible={gameOver !== null} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          padding: 24,
        }}>
        <View
          style={{
            backgroundColor: '#2a2a32',
            borderRadius: 16,
            padding: 24,
            gap: 14,
            maxWidth: 400,
            alignSelf: 'center',
            width: '100%',
          }}>
          <Text style={{ fontSize: 13, color: '#888', fontWeight: '600' }}>Game over</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{gameOver?.title}</Text>
          <Text style={{ fontSize: 16, color: '#c8c8d0', lineHeight: 22 }}>{gameOver?.message}</Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 8,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: '#0a84ff',
              alignItems: 'center',
            }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </View>
  );
}
