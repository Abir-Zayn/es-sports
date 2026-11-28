import Ellipsis from 'lucide-react-native/icons/ellipsis';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { oversPerBowler } from '../utils/friendly-rules';
import type { FriendlySide, FriendlyTeamSquad } from '../types';
import { TeamImagePicker } from './team-image-picker';

type Props = {
  teamA: FriendlyTeamSquad;
  teamB: FriendlyTeamSquad;
  nameA: string;
  nameB: string;
  overs: number;
  playersPerSide: number;
  onImage: (side: FriendlySide, uri?: string, mimeType?: string) => void;
  onRename: (side: FriendlySide, name: string) => void;
  /** Opens the side's actions sheet. */
  onMore: (side: FriendlySide) => void;
  /** Why a side is not ready yet, shown under it. */
  errors?: Partial<Record<FriendlySide, string>>;
};

/**
 * The screen's one hero: both sides stacked with VS between them, then the format as three big numbers. Each side's
 * crest picks its image, tapping its name renames it in place, and the more button opens its actions.
 */
export function FriendlyMatchupHero({ teamA, teamB, nameA, nameB, overs, playersPerSide, onImage, onRename, onMore, errors = {} }: Props) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const quota = oversPerBowler(overs);
  const stats = [
    { key: 'overs', value: overs, label: t('friendly.hero.overs') },
    { key: 'side', value: playersPerSide, label: t('friendly.hero.aSide') },
    { key: 'quota', value: quota, label: t('friendly.hero.perBowler') },
  ];
  return <View style={s.card}>
    <View style={s.faceoff}>
      <Side squad={teamA} name={nameA} label={t('friendly.teamA')} onImage={(uri, mime) => onImage('teamA', uri, mime)}
        onRename={(name) => onRename('teamA', name)} onMore={() => onMore('teamA')} error={errors.teamA} />
      <View style={s.vsRow}>
        <View style={s.rule} />
        <View style={s.vs}><Text style={s.vsText}>{t('friendly.hero.vs')}</Text></View>
        <View style={s.rule} />
      </View>
      <Side squad={teamB} name={nameB} label={t('friendly.teamB')} onImage={(uri, mime) => onImage('teamB', uri, mime)}
        onRename={(name) => onRename('teamB', name)} onMore={() => onMore('teamB')} error={errors.teamB} />
    </View>
    <View style={s.stats} accessible accessibilityLabel={t('friendly.hero.a11y', { teamA: nameA, teamB: nameB, overs, players: playersPerSide, quota })}>
      {stats.map((stat) => <View key={stat.key} style={s.stat}>
        <Text style={s.statValue}>{stat.value}</Text>
        <Text muted style={s.statLabel}>{stat.label}</Text>
      </View>)}
    </View>
  </View>;
}

type SideProps = {
  squad: FriendlyTeamSquad; name: string; label: string;
  onImage: (uri?: string, mimeType?: string) => void; onRename: (name: string) => void; onMore: () => void; error?: string;
};

function Side({ squad, name, label, onImage, onRename, onMore, error }: SideProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  return <View style={s.side}>
    <TeamImagePicker label={label} uri={squad.imageUri} size={dp(56)} onChange={onImage}
      placeholder={<InitialsAvatar label={initialsOf(name)} tone={squad.tone} size={dp(56)} />} />
    <View style={s.sideText}>
      {editing ? (
        <TextInput value={squad.name} onChangeText={onRename} autoFocus maxLength={30} autoCapitalize="words" returnKeyType="done"
          placeholder={t('friendly.team.namePlaceholder', { label })} accessibilityLabel={t('friendly.team.namePlaceholder', { label })}
          placeholderTextColor={colors.textMuted} selectionColor={colors.primary} onSubmitEditing={() => setEditing(false)} onBlur={() => setEditing(false)}
          style={s.nameInput} />
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={t('friendly.hero.editNameA11y', { label })} onPress={() => setEditing(true)}>
          <Text style={s.sideName} numberOfLines={1}>{name}</Text>
        </Pressable>
      )}
      <Text muted style={s.sideMeta}>{t('friendly.hero.inSquad', { count: squad.players.length })}</Text>
      {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
    {/* Small and flat, with the tap area kept large by hitSlop. */}
    <Pressable accessibilityRole="button" accessibilityLabel={t('friendly.hero.moreA11y', { label })} onPress={onMore} hitSlop={dp(12)}
      style={({ pressed }) => [s.more, pressed && s.pressed]}>
      <Ellipsis size={dp(20)} color={colors.textMuted} />
    </Pressable>
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: { gap: spacing.lg, padding: sizes.cardPadding, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  faceoff: { gap: spacing.sm },
  side: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sideText: { flex: 1, minWidth: 0, gap: dp(2) },
  sideName: typography.headlineMd,
  more: { width: dp(28), height: dp(28), alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.5 },
  nameInput: {
    ...typography.headlineMd, color: c.text, paddingVertical: 0, paddingHorizontal: spacing.sm, height: dp(32), lineHeight: undefined,
    borderRadius: radius.sm, borderWidth: 2, borderColor: c.primaryTint, backgroundColor: c.surfaceRaised,
  },
  sideMeta: typography.bodySm,
  error: { ...typography.bodySm, color: c.danger },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
  vs: {
    width: dp(36), height: dp(28), alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, backgroundColor: c.surfaceRaised,
  },
  vsText: { ...typography.labelSm, color: c.textMuted },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: dp(2), paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  statValue: typography.numeralStat,
  statLabel: typography.bodySm,
});
