import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeStandardGameReview } from '@/lib/games/compute-game-review';
import { gameHistoryStorage } from '@/lib/storage/game-history';

const TAB_BAR_CLEARANCE = 72;

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padBottom = insets.bottom + TAB_BAR_CLEARANCE;

  const rec = useMemo(() => (id ? gameHistoryStorage.get(id) : undefined), [id]);

  const review = useMemo(() => (rec ? computeStandardGameReview(rec) : []), [rec]);

  if (!rec) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: padBottom }}>
        <Text selectable>Game not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text selectable style={{ color: '#0a84ff' }}>
            Go back
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: padBottom, gap: 14 }}>
      <Text selectable style={{ fontSize: 17, fontWeight: '700' }}>
        {rec.mode} · {rec.result}
      </Text>
      <Text selectable style={{ opacity: 0.65 }}>
        {new Date(rec.createdAt).toLocaleString()}
      </Text>
      <Text selectable>
        {rec.whiteLabel} vs {rec.blackLabel} · {rec.timeControlId}
      </Text>

      <Text selectable style={{ fontWeight: '600', marginTop: 8 }}>
        Moves
      </Text>
      <View style={{ gap: 4 }}>
        {Array.from({ length: Math.ceil(rec.moves.length / 2) }, (_, i) => {
          const a = rec.moves[i * 2]?.san;
          const b = rec.moves[i * 2 + 1]?.san;
          return (
            <Text key={i} selectable>
              {i + 1}. {a}
              {b ? ` ${b}` : ''}
            </Text>
          );
        })}
      </View>

      <Text selectable style={{ fontWeight: '600', marginTop: 12 }}>
        Review
      </Text>
      {review.length === 0 ? (
        <Text selectable style={{ opacity: 0.65 }}>
          {rec.whiteLabel === 'Human' || rec.blackLabel === 'Human'
            ? 'No engine alternatives stood out for your moves, or only CPU players moved.'
            : 'Review compares human moves to engine suggestions — add a human player to see hints.'}
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {review.map((r, i) => (
            <View
              key={i}
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: '#f2f2f7',
                gap: 4,
              }}>
              <Text selectable style={{ fontWeight: '600' }}>
                {r.playedSan}
              </Text>
              <Text selectable style={{ opacity: 0.75 }}>
                {r.note}
              </Text>
              <Text selectable style={{ fontSize: 13, opacity: 0.6 }}>
                Suggested: {r.suggestedSan}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
