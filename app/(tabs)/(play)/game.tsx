import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { GamePlayView } from '@/components/game-play-view';
import type { AppearanceSettings, CpuDifficulty, GameMode, PlayerKind, TimeControlId } from '@/lib/games/types';

export default function GameScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    mode: string;
    white: string;
    black: string;
    cpuDifficulty: string;
    time: string;
    boardTheme: string;
    pieceTheme: string;
    gid: string;
  }>();

  const mode = (p.mode ?? 'standard') as GameMode;

  useEffect(() => {
    if (mode !== 'standard') {
      router.replace('/(tabs)/(play)');
    }
  }, [mode, router]);

  const white = (p.white ?? 'human') as PlayerKind;
  const black = (p.black ?? 'human') as PlayerKind;
  const cpuDifficulty = (p.cpuDifficulty ?? 'medium') as CpuDifficulty;
  const timeControlId = (p.time ?? '10+0') as TimeControlId;
  const appearance: AppearanceSettings = {
    boardTheme: (p.boardTheme as AppearanceSettings['boardTheme']) ?? 'classic',
    pieceTheme: (p.pieceTheme as AppearanceSettings['pieceTheme']) ?? 'unicode',
  };

  if (mode !== 'standard') {
    return null;
  }

  return (
    <GamePlayView
      key={p.gid ?? 'default'}
      white={white}
      black={black}
      cpuDifficulty={cpuDifficulty}
      timeControlId={timeControlId}
      appearance={appearance}
    />
  );
}
