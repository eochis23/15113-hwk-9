import { Tabs } from 'expo-router';

export default function TabLayoutWeb() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: () => null,
      }}>
      <Tabs.Screen name="(play)" options={{ title: 'Play' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="settings" options={{ title: 'Styles' }} />
    </Tabs>
  );
}
