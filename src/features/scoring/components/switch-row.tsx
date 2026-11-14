import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

export function SwitchRow({ title, detail, value, onChange }: {
  title: string; detail: string; value: boolean; onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  return <View style={s.row}>
    <View style={s.text}><Text style={s.title}>{title}</Text><Text muted style={s.detail}>{detail}</Text></View>
    <Switch accessibilityLabel={title} value={value} onValueChange={onChange}
      trackColor={{ false: colors.outline, true: colors.primary }} thumbColor={value ? colors.primaryText : colors.textMuted} />
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: sizes.cardPaddingTight, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  text: { flex: 1, gap: spacing.xs }, title: typography.labelMd, detail: typography.bodySm,
});
