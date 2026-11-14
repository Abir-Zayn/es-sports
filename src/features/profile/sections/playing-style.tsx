import { StyleSheet, View } from 'react-native';

import { Section, SectionHeader, Text } from '@/components/ui';
import { radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
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
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    label: { ...typography.labelSm, color: colors.textMuted },
  });
