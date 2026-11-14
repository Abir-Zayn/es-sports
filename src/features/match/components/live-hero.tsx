import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { LiveMatchViewData } from '../live/live-view';
import type { LiveSide } from '../types';

type Props = {
  view: Pick<LiveMatchViewData, 'header' | 'sides' | 'summary' | 'currentRunRate' | 'requiredRunRate'>;
  onBack: () => void;
  onShare: () => void;
};

const compactScore = (score: string) => (score.toLowerCase() === 'yet to bat' ? '—' : score);

/** Top of the live screen: clean top bar, central scoreboard between team crests, and key innings rows. */
export function LiveHero({ view, onBack, onShare }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [first, second] = view.sides;
  const status = view.header.status;
  const statusLabel = status === 'live' ? 'LIVE' : status === 'completed' ? 'RESULT' : 'UPCOMING';

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ChevronLeft size={sizes.icon} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.label} numberOfLines={1}>
          {view.header.label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share match"
          onPress={onShare}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Share2 size={sizes.iconSmall} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.scoreboard}>
        <TeamCrest side={first} />

        <View style={styles.centerCol}>
          {status === 'scheduled' ? null : (
            <View style={styles.rates}>
              <Text muted style={styles.rate}>
                CRR <Text style={styles.rateValue}>{view.currentRunRate}</Text>
              </Text>
              {view.requiredRunRate !== null ? (
                <Text muted style={styles.rate}>
                  · RRR <Text style={styles.rateValue}>{view.requiredRunRate}</Text>
                </Text>
              ) : null}
            </View>
          )}
          <View style={styles.scoreLine}>
            <Text style={[styles.scoreNum, !first.batting && status === 'live' && styles.scoreDim]}>
              {compactScore(first.score)}
            </Text>
            <Text style={styles.scoreDash}>–</Text>
            <Text style={[styles.scoreNum, !second.batting && status === 'live' && styles.scoreDim]}>
              {compactScore(second.score)}
            </Text>
          </View>
          <View style={styles.statusRow}>
            {status === 'live' ? <View style={styles.liveDot} /> : null}
            <Text style={[styles.statusText, status === 'live' && styles.statusLive]}>{statusLabel}</Text>
          </View>
        </View>

        <TeamCrest side={second} />
      </View>

      <View style={styles.highlights}>
        <Text style={styles.summary} accessibilityLiveRegion="polite">
          {view.summary}
        </Text>
        {status === 'scheduled' ? null : (
          <View style={styles.eventRows}>
            {[first, second].map((side, idx) => (
              <View key={side.team.short} style={styles.eventRow}>
                <Text muted style={styles.eventName} numberOfLines={1}>
                  {side.team.short} · {idx === 0 ? '1st inn' : '2nd inn'}
                </Text>
                <View style={[styles.eventIcon, side.batting ? styles.eventIconActive : styles.eventIconIdle]} />
                <View style={styles.oversPill}>
                  <Text style={styles.oversText}>{side.overs}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={styles.chevronRow}>
          <ChevronDown size={sizes.iconSmall} color={colors.textMuted} strokeWidth={2.2} />
        </View>
      </View>
    </View>
  );
}

function TeamCrest({ side }: { side: LiveSide }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { team, batting } = side;
  return (
    <View
      accessible
      accessibilityLabel={`${team.name}, ${side.score}, ${side.overs}`}
      style={styles.column}
    >
      <InitialsAvatar
        label={team.short}
        tone={team.tone}
        imageUri={team.avatarUri}
        size={dp(52)}
        borderColor={batting ? colors.primary : 'transparent'}
        borderWidth={2}
      />
      <Text style={styles.teamName} numberOfLines={2}>
        {team.name}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    hero: { paddingHorizontal: sizes.gutter, paddingBottom: spacing.md, backgroundColor: colors.background },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: dp(48) },
    iconBtn: {
      width: sizes.iconButton, height: sizes.iconButton, alignItems: 'center', justifyContent: 'center',
      borderRadius: radius.pill, backgroundColor: colors.surface, ...shadows.iconButton,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    label: { ...typography.headlineLg, flex: 1, textAlign: 'center', color: colors.text, paddingHorizontal: spacing.sm },
    scoreboard: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    column: { width: dp(96), alignItems: 'center', gap: spacing.sm },
    teamName: { ...typography.labelMd, textAlign: 'center', color: colors.text },
    centerCol: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: dp(2), gap: spacing.xs },
    rates: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    rate: { ...typography.labelSm, fontVariant: ['tabular-nums'] },
    rateValue: { ...typography.labelSm, color: colors.text, fontVariant: ['tabular-nums'] },
    scoreLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    scoreNum: { ...typography.numeralStat, color: colors.text },
    scoreDim: { color: colors.textMuted },
    scoreDash: { ...typography.displayMd, color: colors.textMuted },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: dp(6), marginTop: dp(2) },
    liveDot: { width: dp(6), height: dp(6), borderRadius: radius.pill, backgroundColor: colors.live },
    statusText: { ...typography.labelUppercase, color: colors.textMuted },
    statusLive: { color: colors.live },
    highlights: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm },
    summary: { ...typography.bodyMd, color: colors.textMuted, textAlign: 'center' },
    eventRows: { width: '100%', gap: spacing.sm, marginTop: dp(2) },
    eventRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    eventName: { ...typography.bodySm, width: dp(130), textAlign: 'right' },
    eventIcon: { width: dp(10), height: dp(10), borderRadius: radius.pill },
    eventIconActive: { backgroundColor: colors.primary },
    eventIconIdle: { backgroundColor: colors.outline },
    oversPill: { minWidth: dp(52), paddingHorizontal: spacing.sm, paddingVertical: dp(3), borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center' },
    oversText: { ...typography.labelSm, color: colors.text, fontVariant: ['tabular-nums'] },
    chevronRow: { paddingTop: dp(2), alignItems: 'center' },
  });
