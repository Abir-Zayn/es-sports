import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { ProfileData } from '@/types/profile';

type Props = Pick<ProfileData, 'batting' | 'bowling' | 'teams'>;

/** Matches, runs, wickets and teams in one card. */
export function StatStrip({ batting, bowling, teams }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const cells: [TranslationKey, number][] = [
    ['profile.stats.matches', batting.matches],
    ['profile.stats.runs', batting.runs],
    ['profile.stats.wickets', bowling.wickets],
    ['profile.stats.teams', teams.length],
  ];
  return (
    <View style={styles.wrap}>
      <Card padding="none" style={styles.strip}>
        {cells.map(([labelKey, value], i) => {
          const label = t(labelKey);
          return (
            <View key={labelKey} accessible accessibilityLabel={`${label} ${value}`} style={[styles.cell, i < cells.length - 1 && styles.divider]}>
              <Text style={styles.value}>{value}</Text>
              <Text variant="bodySm" muted>
                {label}
              </Text>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: sizes.gutter },
    strip: { flexDirection: 'row', paddingVertical: sizes.cardPaddingTight },
    cell: { flex: 1, alignItems: 'center', gap: spacing.xs },
    divider: { borderRightWidth: 1, borderRightColor: colors.border },
    value: typography.numeralStat,
  });
