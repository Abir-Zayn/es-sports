import { StyleSheet, View } from 'react-native';

import { Section, SectionHeader, Text } from '@/components/ui';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';
import type { PlayerProfile } from '@/types/profile';

import { battingLabels, roleLabels } from '../labels';

/** Role and batting hand as pills. */
export function PlayingStyle({ profile }: { profile: PlayerProfile }) {
  const styles = useThemedStyles(createStyles);
  const pills = [roleLabels[profile.role], battingLabels[profile.battingStyle]];
  return (
    <Section>
      <SectionHeader title="Playing Style" />
      <View style={styles.row}>
        {pills.map((label) => (
          <View key={label} style={styles.pill}>
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    pill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  });
