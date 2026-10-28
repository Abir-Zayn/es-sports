import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  text: { flex: 1, gap: 3 }, title: { fontSize: 14, lineHeight: 19, fontWeight: '700' }, detail: { fontSize: 12, lineHeight: 17 },
});
