import { StyleSheet, View } from 'react-native';

import { AppBadge, Card, Text } from '@/components/ui';
import { spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

/** Where the schedule stands: a draft only the staff see, unpublished edits, published, or with matches under way. */
export type ScheduleStatus = 'draft' | 'changes' | 'published' | 'underway';

type Props = {
  status: ScheduleStatus;
  /** Shown to staff who cannot change the schedule. */
  viewOnly: boolean;
  format: string;
  teams: number;
  dates: string;
  matches: number;
  days: number;
};

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  draft: 'Draft', changes: 'Unpublished changes', published: 'Published', underway: 'Under way',
};

/** The facts at the top of the schedule: its status first, then the format, teams, dates and match count side by side. */
export function ScheduleSummary({ status, viewOnly, format, teams, dates, matches, days }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tone = {
    draft: [colors.surfaceRaised, colors.textMuted], changes: [colors.accentSoft, colors.accent],
    published: [colors.successSoft, colors.success], underway: [colors.primarySoft, colors.link],
  }[status];
  const stats = [
    { label: 'Format', value: format },
    { label: 'Teams', value: String(teams) },
    { label: 'Dates', value: dates },
    { label: matches > 0 ? `Matches · ${days} ${days === 1 ? 'day' : 'days'}` : 'Matches', value: matches > 0 ? String(matches) : '—' },
  ];
  return (
    <Card style={styles.card}>
      <View style={styles.badges}>
        <AppBadge label={STATUS_LABEL[status]} backgroundColor={tone[0]} color={tone[1]} dot={status === 'underway'} />
        {viewOnly ? <AppBadge label="View only" /> : null}
      </View>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat} accessible accessibilityLabel={`${stat.label}: ${stat.value === '—' ? 'none yet' : stat.value}`}>
            <Text style={styles.value} numberOfLines={1}>{stat.value}</Text>
            <Text muted style={styles.label} numberOfLines={1}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const createStyles = (_colors: Palette) =>
  StyleSheet.create({
    card: { gap: spacing.md },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
    stat: { width: '50%', gap: spacing.xs, paddingRight: spacing.sm },
    value: { ...typography.headlineMd, fontVariant: ['tabular-nums'] },
    label: typography.bodySm,
  });
