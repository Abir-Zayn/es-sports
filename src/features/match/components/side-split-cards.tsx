import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Props = { off: number; leg: number; offPercent: number; legPercent: number };

/** Runs scored on the off side and on the leg side, side by side. */
export function SideSplitCards({ off, leg, offPercent, legPercent }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <SideCard label={t('match.wagon.offSide')} runs={off} percent={offPercent} />
      <SideCard label={t('match.wagon.legSide')} runs={leg} percent={legPercent} />
    </View>
  );
}

function SideCard({ label, runs, percent }: { label: string; runs: number; percent: number }) {
  const themed = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View accessible accessibilityLabel={t('match.wagon.sideA11y', { side: label.toLowerCase(), runs, percent })} style={themed.card}>
      <Text muted style={themed.label}>
        {label}
      </Text>
      <Text style={themed.runs}>
        {runs}{' '}
        <Text muted style={themed.detail}>
          {t('match.wagon.runsPercent', { percent })}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
});

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.xs,
    },
    label: typography.labelUppercase,
    runs: typography.numeralStat,
    detail: typography.bodySm,
  });
