import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { LiveMatchViewData } from '../live/live-view';
import type { LiveSide } from '../types';

type Props = {
  view: Pick<LiveMatchViewData, 'header' | 'sides' | 'summary' | 'currentRunRate' | 'requiredRunRate'>;
  onBack: () => void;
  onShare: () => void;
};

const STATUS_KEY = {
  live: 'match.hero.live',
  completed: 'match.hero.completed',
  scheduled: 'match.hero.scheduled',
} as const;

/** Top of the live screen: top bar, status pill, each team's score under its crest, then the chase or result banner. */
export function LiveHero({ view, onBack, onShare }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [first, second] = view.sides;
  const status = view.header.status;
  const isLive = status === 'live';

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={onBack} hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <ChevronLeft size={sizes.icon} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.label} numberOfLines={1}>{view.header.label}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('match.shareA11y')} onPress={onShare} hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Share2 size={sizes.iconSmall} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={[styles.statusPill, isLive && styles.statusPillLive]}>
          {isLive ? <View style={styles.liveDot} /> : null}
          <Text style={[styles.statusText, isLive && styles.statusTextLive]}>{t(STATUS_KEY[status])}</Text>
        </View>

        <View style={styles.scoreboard}>
          <TeamColumn side={first} dim={isLive && !first.batting} />
          <Text muted style={styles.vs}>{t('matchCard.versus')}</Text>
          <TeamColumn side={second} dim={isLive && !second.batting} />
        </View>

        <View style={styles.banner}>
          <Text style={styles.summary} accessibilityLiveRegion="polite">{view.summary}</Text>
          {status === 'scheduled' ? null : (
            <View style={styles.rates}>
              <Rate label="CRR" value={view.currentRunRate} />
              {view.requiredRunRate !== null ? <View style={styles.rateDivider} /> : null}
              {view.requiredRunRate !== null ? <Rate label="RRR" value={view.requiredRunRate} /> : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Rate({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <Text muted style={styles.rate} accessibilityLabel={t(label === 'CRR' ? 'match.hero.crrA11y' : 'match.hero.rrrA11y', { value })}>
      {label} <Text style={styles.rateValue}>{value}</Text>
    </Text>
  );
}

function TeamColumn({ side, dim }: { side: LiveSide; dim: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { team, batting } = side;
  const yetToBat = side.score === t('match.yetToBat') || side.score.toLowerCase() === 'yet to bat';
  const displayScore = yetToBat ? t('match.yetToBat') : side.score;
  return (
    <View accessible accessibilityLabel={`${team.name}, ${displayScore}${side.overs ? `, ${side.overs}` : ''}`} style={styles.column}>
      <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(56)}
        borderColor={batting ? colors.primary : 'transparent'} borderWidth={2} />
      <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
      {yetToBat ? (
        <Text muted style={styles.yetToBat}>{displayScore}</Text>
      ) : (
        <Text style={[styles.score, dim && styles.scoreDim]} numberOfLines={1} adjustsFontSizeToFit>{side.score}</Text>
      )}
      {side.overs ? (
        <Text style={[styles.overs, batting && styles.oversBatting]} numberOfLines={1}>{side.overs}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    hero: { paddingHorizontal: sizes.gutter, paddingBottom: spacing.lg, backgroundColor: colors.background },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: dp(48) },
    iconBtn: {
      width: sizes.iconButton, height: sizes.iconButton, alignItems: 'center', justifyContent: 'center',
      borderRadius: radius.pill, backgroundColor: colors.surface, ...shadows.iconButton,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    label: { ...typography.labelUppercase, flex: 1, textAlign: 'center', color: colors.textMuted, paddingHorizontal: spacing.sm },
    card: { marginTop: spacing.md, paddingVertical: spacing.lg, gap: spacing.lg, alignItems: 'center' },
    statusPill: {
      flexDirection: 'row', alignItems: 'center', gap: dp(6), paddingHorizontal: spacing.md, paddingVertical: dp(5),
      borderRadius: radius.pill, backgroundColor: colors.surfaceRaised,
    },
    statusPillLive: { backgroundColor: colors.dangerSoft },
    liveDot: { width: dp(7), height: dp(7), borderRadius: radius.pill, backgroundColor: colors.live },
    statusText: { ...typography.labelUppercase, color: colors.textMuted },
    statusTextLive: { color: colors.dangerSoftText },
    scoreboard: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    vs: { ...typography.labelUppercase, marginTop: dp(20) },
    column: { flex: 1, alignItems: 'center', gap: dp(6), minWidth: 0 },
    teamName: { ...typography.labelMd, color: colors.text, textAlign: 'center', marginTop: dp(2) },
    score: { ...typography.numeralStat, color: colors.text },
    scoreDim: { color: colors.textMuted },
    yetToBat: { ...typography.bodyMd, lineHeight: typography.numeralStat.lineHeight },
    overs: { ...typography.labelSm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    oversBatting: { color: colors.link },
    banner: {
      width: '100%', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
      borderRadius: radius.md, backgroundColor: colors.primarySoft,
    },
    summary: { ...typography.labelMd, lineHeight: dp(20), color: colors.text, textAlign: 'center' },
    rates: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rateDivider: { width: 1, height: dp(12), backgroundColor: colors.outline },
    rate: { ...typography.labelSm, fontVariant: ['tabular-nums'] },
    rateValue: { ...typography.labelSm, color: colors.text, fontVariant: ['tabular-nums'] },
  });
