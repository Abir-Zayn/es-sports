import { StyleSheet, View } from 'react-native';

import { BallChip } from '@/components/match/ball-chip';
import { Text } from '@/components/ui';
import { dp, spacing, typography } from '@/theme';

import type { Delivery } from '../types';

export function OverBalls({ deliveries, number, showEmpty = true }: { deliveries: Delivery[]; number?: number; showEmpty?: boolean }) {
  const empty = showEmpty ? Math.max(0, 6 - deliveries.filter((d) => d.legal).length) : 0;
  return <View style={s.row} accessible accessibilityLabel={`Over ${number ?? ''}: ${deliveries.map((d) => `${d.label}${d.total > 1 && d.kind !== 'runs' ? `, ${d.total} runs` : ''}`).join(', ')}`}>
    {number ? <Text muted style={s.label}>Over {number}</Text> : null}
    {deliveries.map((d) => <BallChip key={d.id} value={d.label} size={dp(30)} />)}
    {Array.from({ length: empty }, (_, i) => <BallChip key={`empty-${i}`} value="" size={dp(30)} />)}
  </View>;
}
const s = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }, label: { ...typography.bodySm, marginRight: spacing.xs / 2 } });
