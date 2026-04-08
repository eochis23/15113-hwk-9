import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayoutWeb() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="(play)"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, size }) => <FontAwesome name="gamepad" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <FontAwesome name="history" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Styles',
          tabBarIcon: ({ color, size }) => <FontAwesome name="paint-brush" color={color} size={size ?? 24} />,
        }}
      />
    </Tabs>
  );
}
