import { Stack } from 'expo-router';

export default function PlayStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Play', headerLargeTitle: true }} />
      <Stack.Screen name="setup" options={{ title: 'New game' }} />
      <Stack.Screen name="game" options={{ title: 'Game', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
