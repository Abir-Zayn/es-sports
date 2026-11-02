import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { OVERS_OPTIONS, oversPerBowler, SIDE_MAX, SIDE_MIN } from '../friendly/friendly-rules';

type FormatProps = {
  overs: number;
  playersPerSide: number;
  error?: string;
  onOvers: (overs: number) => void;
  onPlayersPerSide: (size: number) => void;
};

/** Overs as one-tap circles and the side size as a stepper, with what that means for each bowler. */
export function FriendlyFormatCard({ overs, playersPerSide, error, onOvers, onPlayersPerSide }: FormatProps) {
  const s = useThemedStyles(styles);
  const quota = oversPerBowler(overs);
  return <View style={s.card}>
    <Text muted style={s.label}>Overs</Text>
    <View style={s.pills} accessibilityRole="radiogroup" accessibilityLabel="Overs">
      {OVERS_OPTIONS.map((value) => {
        const on = value === overs;
        return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${value} overs`}
          onPress={() => onOvers(value)} style={({ pressed }) => [s.pill, on && s.pillOn, pressed && s.pressed]}>
          <Text style={[s.pillText, on && s.pillTextOn]}>{value}</Text>
        </Pressable>;
      })}
    </View>
    <View style={s.divider} />
    <View style={s.stepper}>
      <View style={s.stepperText}>
        <Text style={s.rowTitle}>Players a side</Text>
        <Text muted style={s.caption}>{SIDE_MIN} to {SIDE_MAX}</Text>
      </View>
      <View style={s.stepperControl}>
        <AppIconTile icon={Minus} size={44} borderRadius={radius.pill} accessibilityLabel="Fewer players a side"
          onPress={playersPerSide > SIDE_MIN ? () => onPlayersPerSide(playersPerSide - 1) : undefined} />
        <Text style={s.value} accessibilityLabel={`Players a side, ${playersPerSide}`}>{playersPerSide}</Text>
        <AppIconTile icon={Plus} size={44} borderRadius={radius.pill} accessibilityLabel="More players a side"
          onPress={playersPerSide < SIDE_MAX ? () => onPlayersPerSide(playersPerSide + 1) : undefined} />
      </View>
    </View>
    <Text muted style={s.caption}>{overs} overs · {playersPerSide} a side · up to {quota} over{quota === 1 ? '' : 's'} per bowler. Extra players sit on the bench.</Text>
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
  </View>;
}

type ScorerProps = { name: string; avatarUrl?: string | null; detail: string; error?: string; onPress: () => void };

/** Who may enter the score. Opens a picker of the creator and the app users in either squad. */
export function ScorerAssignmentRow({ name, avatarUrl, detail, error, onPress }: ScorerProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return <View style={s.group}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Scorer: ${name}. Change scorer`} onPress={onPress}
      style={({ pressed }) => [s.card, s.row, pressed && s.rowPressed]}>
      <InitialsAvatar label={initialsOf(name)} imageUri={avatarUrl} size={44} />
      <View style={s.rowText}><Text style={s.rowTitle}>{name}</Text><Text muted style={s.caption}>{detail}</Text></View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  group: { gap: spacing.sm },
  card: { gap: spacing.md, padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
  },
  pillOn: {
    borderColor: c.primary, backgroundColor: c.primary,
    shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  pressed: { opacity: 0.8 },
  pillText: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: c.textMuted, fontVariant: ['tabular-nums'] },
  pillTextOn: { color: c.primaryText },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperText: { flex: 1, gap: 2 },
  stepperControl: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.xs,
    borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
  },
  value: { minWidth: 32, textAlign: 'center', fontSize: 20, lineHeight: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  error: { fontSize: 13, lineHeight: 18, color: c.danger },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  rowPressed: { backgroundColor: c.surfaceRaised },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
});
