import { StyleSheet, View } from 'react-native';

import { FixtureTile } from '@/components/match/fixture-tile';
import { Text } from '@/components/ui';
import { useOpenMatch } from '@/features/match/use-match-routes';
import { useThemedStyles, type Palette } from '@/theme';

import type { ScheduleGroup } from '../schedule';

type Props = { group: ScheduleGroup; showTitle: boolean };

/** Live now, Upcoming or Results: month headings over flat bars (a live match has no month heading). */
export function ScheduleGroupSection({ group, showTitle }: Props) {
  const openMatch = useOpenMatch();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.group}>
      {showTitle ? (
        <Text accessibilityRole="header" style={styles.title}>
          {group.title}
        </Text>
      ) : null}
      {group.slices.map(({ key, heading, fixtures }) => (
        <View key={key} style={styles.slice}>
          {heading ? <Text style={styles.heading}>{heading}</Text> : null}
          {fixtures.map((fixture) => (
            <FixtureTile key={fixture.id} fixture={fixture} onPress={() => openMatch(fixture.id, fixture.state)} />
          ))}
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    group: { gap: 14 },
    title: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textMuted },
    slice: { gap: 4 },
    heading: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.text },
  });
