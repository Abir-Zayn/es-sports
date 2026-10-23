import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { useThemedStyles, type Palette } from '@/theme';
import type { FixtureGroup } from '@/types/cricket';

import { FixtureCard } from '../components/fixture-card';

/** A titled stack of matches: Live, Upcoming, Knockouts or Results. */
export function FixtureGroupSection({ group }: { group: FixtureGroup }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={styles.title}>
        {group.title}
      </Text>
      {group.fixtures.map((fixture) => (
        <FixtureCard
          key={fixture.id}
          fixture={fixture}
          onPress={() => comingSoon(fixture.state === 'live' ? 'Live match' : 'Match')}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    group: { gap: 10 },
    title: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textMuted },
  });
