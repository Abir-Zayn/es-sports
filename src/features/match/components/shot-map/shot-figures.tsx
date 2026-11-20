import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { Shot } from '../../types';
import { sideSplit } from '../../utils/wagon-geometry';

/** Shots, runs, fours and sixes for what the map shows, side by side under the field. */
export function KeyFigures({ shots }: { shots: Shot[] }) {
  const s = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const figures = [
    { label: t('match.wagon.shotsLabel'), value: shots.length },
    { label: t('match.wagon.runsLabel'), value: shots.reduce((sum, x) => sum + x.runs, 0) },
    { label: t('match.wagon.filterFours'), value: shots.filter((x) => x.runs === 4).length },
    { label: t('match.wagon.filterSixes'), value: shots.filter((x) => x.runs === 6).length },
  ];
  return (
    <View style={s.figures}>
      {figures.map((f) => (
        <View key={f.label} style={s.figure} accessible accessibilityLabel={`${f.label}: ${f.value}`}>
          <Text style={s.value}>{f.value}</Text>
          <Text muted style={s.label}>{f.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Off-side and leg-side runs as one bar, off on the left as on the field's right-hand half. */
export function SideBar({ shots }: { shots: Shot[] }) {
  const s = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const split = sideSplit(shots);
  return (
    <View style={s.side} accessible
      accessibilityLabel={t('match.wagon.splitA11y', { off: split.off, offPercent: split.offPercent, leg: split.leg, legPercent: split.legPercent })}>
      <View style={s.sideLabels}>
        <Text style={s.sideText}>{`${t('match.wagon.offShort')} ${split.off}`} <Text muted style={s.pct}>{`${split.offPercent}%`}</Text></Text>
        <Text style={s.sideText}><Text muted style={s.pct}>{`${split.legPercent}%`}</Text>{` ${split.leg} ${t('match.wagon.legShort')}`}</Text>
      </View>
      <View style={s.track}>
        <View style={[s.off, { flex: split.off || (split.leg ? 0 : 1) }]} />
        <View style={[s.leg, { flex: split.leg }]} />
      </View>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  figures: { flexDirection: 'row', paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  figure: { flex: 1, alignItems: 'center', gap: spacing.xs },
  value: { ...typography.headlineMd, color: c.text, fontVariant: ['tabular-nums'] },
  label: typography.bodySm,
  side: { gap: spacing.sm },
  sideLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sideText: { ...typography.labelMd, color: c.text, fontVariant: ['tabular-nums'] },
  pct: typography.bodySm,
  track: { flexDirection: 'row', height: sizes.progressBar, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: c.border, gap: 2 },
  off: { backgroundColor: c.primary },
  leg: { backgroundColor: c.accent },
});
