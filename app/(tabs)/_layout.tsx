import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(play)">
        <Icon src={<VectorIcon family={MaterialIcons} name="sports-esports" />} />
        <Label>Play</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon src={<VectorIcon family={MaterialIcons} name="history" />} />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon src={<VectorIcon family={MaterialIcons} name="palette" />} />
        <Label>Styles</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
