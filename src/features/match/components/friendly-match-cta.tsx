import Zap from 'lucide-react-native/icons/zap';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

/** The way into a quick friendly match: two teams, a toss and live scoring, without a tournament. */
export function FriendlyMatchCta({ onPress }: { onPress: () => void }) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return <View style={s.card}>
    <View style={s.icon}><Zap size={22} color={colors.primaryText} /></View>
    <View style={s.text}>
      <Text style={s.title}>Friendly match</Text>
      <Text muted style={s.detail}>Pick two teams, toss and start scoring in under a minute.</Text>
    </View>
    <Button label="+ Friendly Match" size="compact" onPress={onPress} />
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary },
  text: { flex: 1, minWidth: 160, gap: 2 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 17 },
});
