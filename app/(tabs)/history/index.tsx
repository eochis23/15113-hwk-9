import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { SavedGameRecord } from '@/lib/games/types';
import { gameHistoryStorage } from '@/lib/storage/game-history';

export default function HistoryScreen() {
  const [rows, setRows] = useState<SavedGameRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRows(gameHistoryStorage.list());
    }, [])
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 12 }}>
      {rows.length === 0 ? (
        <Text selectable style={{ opacity: 0.6 }}>
          Finished games are saved here automatically.
        </Text>
      ) : (
        rows.map((r) => (
          <View
            key={r.id}
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: '#f2f2f7',
              gap: 6,
            }}>
            <Text selectable style={{ fontWeight: '600' }}>
              {r.mode} · {r.result}
            </Text>
            <Text selectable style={{ fontSize: 13, opacity: 0.65 }}>
              {new Date(r.createdAt).toLocaleString()} · {r.whiteLabel} vs {r.blackLabel} · {r.timeControlId}
            </Text>
            <Text selectable style={{ fontSize: 13 }}>
              {r.moves.length} moves
            </Text>
            {r.review.length > 0 ? (
              <Text selectable style={{ fontSize: 13 }}>
                {r.review.length} review note{r.review.length === 1 ? '' : 's'}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
