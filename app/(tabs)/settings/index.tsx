import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { AppearanceSettings, BoardThemeId, PieceThemeId } from '@/lib/games/types';
import { loadAppearance, saveAppearance } from '@/lib/storage/appearance-settings';

const BOARDS: { id: BoardThemeId; label: string }[] = [
  { id: 'classic', label: 'Classic wood' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'gray', label: 'Gray' },
];

const PIECES: { id: PieceThemeId; label: string }[] = [
  { id: 'unicode', label: 'Unicode symbols' },
  { id: 'letter', label: 'Letters (K,Q,R…)' },
  { id: 'minimal', label: 'Minimal letters' },
];

export default function SettingsScreen() {
  const [s, setS] = useState<AppearanceSettings>(() => loadAppearance());

  const persist = useCallback((next: AppearanceSettings) => {
    setS(next);
    saveAppearance(next);
  }, []);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 20 }}>
      <View style={{ gap: 10 }}>
        <Text selectable style={{ fontWeight: '600' }}>
          Board style
        </Text>
        {BOARDS.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => persist({ ...s, boardTheme: b.id })}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: s.boardTheme === b.id ? '#d1e7ff' : '#f2f2f7',
            }}>
            <Text selectable>{b.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Text selectable style={{ fontWeight: '600' }}>
          Piece style
        </Text>
        {PIECES.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => persist({ ...s, pieceTheme: b.id })}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: s.pieceTheme === b.id ? '#d1e7ff' : '#f2f2f7',
            }}>
            <Text selectable>{b.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
