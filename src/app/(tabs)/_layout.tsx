import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { BottomNav } from '@/components/navigation/bottom-nav';
import { RadialCreateMenu, type CreateChoice } from '@/components/navigation/radial-create-menu';

export default function TabsLayout() {
  const [creating, setCreating] = useState(false);
  const closeMenu = useCallback(() => setCreating(false), []);
  function choose(choice: CreateChoice) {
    setCreating(false);
    router.push(choice === 'tournament' ? '/tournament/create' : '/match/friendly/setup');
  }
  return (
    <Tabs style={styles.tabs}>
      <TabSlot />
      <BottomNav onCreate={() => setCreating(true)} />
      <RadialCreateMenu open={creating} onChoose={choose} onClose={closeMenu} />
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
