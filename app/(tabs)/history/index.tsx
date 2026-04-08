import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SavedGameRecord } from '@/lib/games/types';
import { gameHistoryStorage } from '@/lib/storage/game-history';

const TAB_BAR_CLEARANCE = 72;

export default function HistoryScreen() {
  const [rows, setRows] = useState<SavedGameRecord[]>([]);
  const insets = useSafeAreaInsets();
  const padBottom = insets.bottom + TAB_BAR_CLEARANCE;

  useFocusEffect(
    useCallback(() => {
      setRows(gameHistoryStorage.list());
    }, [])
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: padBottom, gap: 12 }}>
      {rows.length === 0 ? (
        <Text selectable style={{ opacity: 0.6 }}>
          Finished games are saved here automatically.
        </Text>
      ) : (
        rows.map((r) => (
          <Link key={r.id} href={{ pathname: '/history/[id]', params: { id: r.id } }} asChild>
            <Pressable
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: '#f2f2f7',
                gap: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}>
              <Text selectable style={{ fontWeight: '600' }}>
                {r.mode} · {r.result}
              </Text>
              <Text selectable style={{ fontSize: 13, opacity: 0.65 }}>
                {new Date(r.createdAt).toLocaleString()} · {r.whiteLabel} vs {r.blackLabel} ·{' '}
                {r.timeControlId}
              </Text>
              <Text selectable style={{ fontSize: 13 }}>
                {r.moves.length} moves · tap for moves & review
              </Text>
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
  );
}
