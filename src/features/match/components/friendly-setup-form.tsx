import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const quota = oversPerBowler(overs);
  const quotaText = quota === 1 ? t('friendly.form.overOne', { count: quota }) : t('friendly.form.overMany', { count: quota });
  return <View style={s.card}>
    <Text muted style={s.label}>{t('friendly.form.oversLabel')}</Text>
    <View style={s.pills} accessibilityRole="radiogroup" accessibilityLabel={t('friendly.form.oversLabel')}>
      {OVERS_OPTIONS.map((value) => {
        const on = value === overs;
        return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={t('friendly.form.oversOptionA11y', { count: value })}
          onPress={() => onOvers(value)} style={({ pressed }) => [s.pill, on && s.pillOn, pressed && s.pressed]}>
          <Text style={[s.pillText, on && s.pillTextOn]}>{value}</Text>
        </Pressable>;
      })}
    </View>
    <View style={s.divider} />
    <View style={s.stepper}>
      <View style={s.stepperText}>
        <Text style={s.rowTitle}>{t('friendly.form.playersPerSide')}</Text>
        <Text muted style={s.caption}>{t('friendly.form.playersRange', { min: SIDE_MIN, max: SIDE_MAX })}</Text>
      </View>
      <View style={s.stepperControl}>
        <AppIconTile icon={Minus} size={sizes.iconButton} borderRadius={radius.pill} backgroundColor={colors.surface} accessibilityLabel={t('friendly.form.fewerPlayersA11y')}
          onPress={playersPerSide > SIDE_MIN ? () => onPlayersPerSide(playersPerSide - 1) : undefined} />
        <Text style={s.value} accessibilityLabel={t('friendly.form.playersValueA11y', { count: playersPerSide })}>{playersPerSide}</Text>
        <AppIconTile icon={Plus} size={sizes.iconButton} borderRadius={radius.pill} backgroundColor={colors.surface} accessibilityLabel={t('friendly.form.morePlayersA11y')}
          onPress={playersPerSide < SIDE_MAX ? () => onPlayersPerSide(playersPerSide + 1) : undefined} />
      </View>
    </View>
    <Text muted style={s.caption}>{t('friendly.form.summary', { overs, players: playersPerSide, quotaText })}</Text>
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
  </View>;
}

type ScorerProps = { name: string; avatarUrl?: string | null; detail: string; error?: string; onPress: () => void };

/** Who may enter the score. Opens a picker of the creator and the app users in either squad. */
export function ScorerAssignmentRow({ name, avatarUrl, detail, error, onPress }: ScorerProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  return <View style={s.group}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('friendly.form.scorerA11y', { name })} onPress={onPress}
      style={({ pressed }) => [s.card, s.row, pressed && s.rowPressed]}>
      <InitialsAvatar label={initialsOf(name)} imageUri={avatarUrl} size={sizes.avatar} />
      <View style={s.rowText}><Text style={s.rowTitle}>{name}</Text><Text muted style={s.caption}>{detail}</Text></View>
      <ChevronRight size={sizes.icon} color={colors.textMuted} />
    </Pressable>
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  group: { gap: spacing.sm },
  card: { gap: spacing.md, padding: sizes.cardPaddingTight, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  label: typography.labelUppercase,
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    width: dp(48), height: dp(48), alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent', backgroundColor: c.surfaceRaised,
  },
  pillOn: { borderColor: c.primary, backgroundColor: c.primarySoft },
  pressed: { transform: [{ scale: 0.95 }] },
  pillText: { ...typography.labelMd, color: c.textMuted, fontVariant: ['tabular-nums'] },
  pillTextOn: { color: c.link },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperText: { flex: 1, gap: dp(2) },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.xs, borderRadius: radius.pill, backgroundColor: c.surfaceRaised },
  value: { ...typography.headlineLg, minWidth: dp(32), textAlign: 'center', fontVariant: ['tabular-nums'] },
  caption: typography.bodySm,
  error: { ...typography.bodySm, color: c.danger },
  row: { minHeight: dp(76), flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  rowPressed: { transform: [{ scale: 0.98 }] },
  rowText: { flex: 1, gap: dp(2) },
  rowTitle: typography.headlineMd,
});
