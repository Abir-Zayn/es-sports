import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIconTile, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { OVERS_OPTIONS, oversPerBowler, SIDE_MAX, SIDE_MIN } from '../friendly/friendly-rules';

type FormatProps = {
  overs: number;
  playersPerSide: number;
  error?: string;
  onOvers: (overs: number) => void;
  onPlayersPerSide: (size: number) => void;
};

/** Overs as one-tap pills and the side size as a stepper, with what that means for each bowler. */
export function FriendlyFormatCard({ overs, playersPerSide, error, onOvers, onPlayersPerSide }: FormatProps) {
  const s = useThemedStyles(styles);
  const quota = oversPerBowler(overs);
  return <View style={s.card}>
    <Text style={s.heading} accessibilityRole="header">Format</Text>
    <View style={s.pills} accessibilityRole="radiogroup" accessibilityLabel="Overs">
      {OVERS_OPTIONS.map((value) => {
        const on = value === overs;
        return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${value} overs`}
          onPress={() => onOvers(value)} style={[s.pill, on && s.pillOn]}>
          <Text style={[s.pillText, on && s.pillTextOn]}>{value}</Text>
        </Pressable>;
      })}
    </View>
    <View style={s.stepper}>
      <Text style={s.label}>Players a side</Text>
      <AppIconTile icon={Minus} size={44} borderRadius={radius.pill} accessibilityLabel="Fewer players a side"
        onPress={playersPerSide > SIDE_MIN ? () => onPlayersPerSide(playersPerSide - 1) : undefined} />
      <Text style={s.value} accessibilityLabel={`Players a side, ${playersPerSide}`}>{playersPerSide}</Text>
      <AppIconTile icon={Plus} size={44} borderRadius={radius.pill} accessibilityLabel="More players a side"
        onPress={playersPerSide < SIDE_MAX ? () => onPlayersPerSide(playersPerSide + 1) : undefined} />
    </View>
    <Text muted style={s.caption}>{overs} overs · {playersPerSide} a side · up to {quota} over{quota === 1 ? '' : 's'} per bowler. Extra players sit on the bench.</Text>
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
  </View>;
}

type ScorerProps = { name: string; detail: string; error?: string; onPress: () => void };

/** Who may enter the score. Opens a picker of the creator and the app users in either squad. */
export function ScorerAssignmentRow({ name, detail, error, onPress }: ScorerProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return <View style={s.card}>
    <Text style={s.heading} accessibilityRole="header">Scorer</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Scorer: ${name}. Change scorer`} onPress={onPress} style={s.row}>
      <View style={s.rowText}><Text style={s.name}>{name}</Text><Text muted style={s.caption}>{detail}</Text></View>
      <ChevronDown size={18} color={colors.textMuted} />
    </Pressable>
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  heading: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { minWidth: 48, minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.background },
  pillOn: { borderColor: c.primary, backgroundColor: c.primary },
  pillText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  pillTextOn: { color: c.primaryText },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  value: { minWidth: 28, textAlign: 'center', fontSize: 20, lineHeight: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12, lineHeight: 17 },
  error: { fontSize: 13, lineHeight: 18, color: c.danger },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 14, borderWidth: 1, borderColor: c.border },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
});
