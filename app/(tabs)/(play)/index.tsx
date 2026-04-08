import { Link } from 'expo-router';
import { Alert, Pressable, ScrollView, Text } from 'react-native';

import type { GameMode } from '@/lib/games/types';

const MODES: { id: GameMode; label: string; hint: string; ready: boolean }[] = [
  { id: 'standard', label: 'Standard chess', hint: 'FIDE rules — play now', ready: true },
  { id: 'crazyhouse', label: 'Crazyhouse', hint: 'Coming in a future update', ready: false },
  { id: 'atomic', label: 'Atomic', hint: 'Coming in a future update', ready: false },
  { id: 'duck', label: 'Duck chess', hint: 'Coming in a future update', ready: false },
  { id: 'checkers', label: 'Checkers', hint: 'Coming in a future update', ready: false },
];

export default function PlayHomeScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text selectable style={{ fontSize: 20, fontWeight: '700' }}>
        Play
      </Text>
      <Text selectable style={{ opacity: 0.65, marginBottom: 4 }}>
        Standard chess is fully playable (human vs human, human vs CPU, clocks, history, review hints, and
        board styles). Other modes will be added one at a time.
      </Text>
      {MODES.map((m) =>
        m.ready ? (
          <Link key={m.id} href={{ pathname: '/setup', params: { mode: m.id } }} asChild>
            <Pressable
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#f2f2f7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}>
              <Text selectable style={{ fontSize: 17, fontWeight: '600' }}>
                {m.label}
              </Text>
              <Text selectable style={{ marginTop: 4, opacity: 0.65 }}>
                {m.hint}
              </Text>
            </Pressable>
          </Link>
        ) : (
          <Pressable
            key={m.id}
            onPress={() =>
              Alert.alert('Coming soon', `${m.label} will be added in a later iteration.`, [
                { text: 'OK' },
              ])
            }
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#eaeaec',
              opacity: 0.85,
            }}>
            <Text selectable style={{ fontSize: 17, fontWeight: '600', opacity: 0.55 }}>
              {m.label}
            </Text>
            <Text selectable style={{ marginTop: 4, opacity: 0.5 }}>
              {m.hint}
            </Text>
          </Pressable>
        )
      )}
    </ScrollView>
  );
}
