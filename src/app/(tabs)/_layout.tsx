import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { BottomNav } from '@/components/navigation/bottom-nav';

export default function TabsLayout() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot />
      <BottomNav onCreate={() => router.push('/tournament/create')} />
      <TabList style={styles.hidden}>
        <TabTrigger name="home" href="/home" />
        <TabTrigger name="tournaments" href="/tournaments" />
        <TabTrigger name="matches" href="/matches" />
        <TabTrigger name="profile" href="/profile" />
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  hidden: { display: 'none' },
});
