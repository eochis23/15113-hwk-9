import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { loadAppearance } from '@/lib/storage/appearance-settings';
import type { CpuDifficulty, GameMode, PlayerKind, TimeControlId } from '@/lib/games/types';
import { TIME_CONTROLS } from '@/lib/games/types';

export default function SetupScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const mode = (modeParam ?? 'standard') as GameMode;

  useEffect(() => {
    if (mode !== 'standard') {
      router.replace('/(tabs)/(play)');
    }
  }, [mode, router]);

  const [white, setWhite] = useState<PlayerKind>('human');
  const [black, setBlack] = useState<PlayerKind>('human');
  const [cpuDifficulty, setCpu] = useState<CpuDifficulty>('medium');
  const [timeId, setTimeId] = useState<TimeControlId>('10+0');

  const appearance = useMemo(() => loadAppearance(), []);

  const start = () => {
    router.push({
      pathname: '/game',
      params: {
        mode: 'standard',
        white,
        black,
        cpuDifficulty,
        time: timeId,
        boardTheme: appearance.boardTheme,
        pieceTheme: appearance.pieceTheme,
        gid: String(Date.now()),
      },
    });
  };

  if (mode !== 'standard') {
    return null;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text selectable style={{ fontSize: 15, opacity: 0.7 }}>
        Standard chess — new game
      </Text>
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontWeight: '600' }}>
          White
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['human', 'cpu'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setWhite(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: white === p ? '#0a84ff' : '#e5e5ea',
              }}>
              <Text selectable style={{ color: white === p ? '#fff' : '#000' }}>
                {p === 'human' ? 'Human' : 'CPU'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontWeight: '600' }}>
          Black
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['human', 'cpu'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setBlack(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: black === p ? '#0a84ff' : '#e5e5ea',
              }}>
              <Text selectable style={{ color: black === p ? '#fff' : '#000' }}>
                {p === 'human' ? 'Human' : 'CPU'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {(white === 'cpu' || black === 'cpu') && (
        <View style={{ gap: 8 }}>
          <Text selectable style={{ fontWeight: '600' }}>
            CPU difficulty
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <Pressable
                key={d}
                onPress={() => setCpu(d)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: cpuDifficulty === d ? '#34c759' : '#e5e5ea',
                }}>
                <Text selectable>{d}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontWeight: '600' }}>
          Time control
        </Text>
        {TIME_CONTROLS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTimeId(t.id)}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: timeId === t.id ? '#d1e7ff' : '#f2f2f7',
            }}>
            <Text selectable>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={start}
        style={{
          marginTop: 8,
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#0a84ff',
          alignItems: 'center',
        }}>
        <Text selectable style={{ color: '#fff', fontWeight: '700' }}>
          Start game
        </Text>
      </Pressable>
    </ScrollView>
  );
}
