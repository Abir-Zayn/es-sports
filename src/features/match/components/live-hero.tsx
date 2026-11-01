import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { LiveMatchViewData } from '../live/live-view';
import type { LiveSide } from '../types';

const AMBER_PILL = '#E08214';
const ON_AMBER = '#0A0E0D';

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
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.2} />
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
          <Share2 size={18} color={colors.textMuted} strokeWidth={2} />
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
                <View style={styles.amberPill}>
                  <Text style={styles.amberText}>{side.overs}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={styles.chevronRow}>
          <ChevronDown size={16} color={colors.textMuted} strokeWidth={2.2} />
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
        size={52}
        borderColor={batting ? colors.accent : colors.border}
        borderWidth={batting ? 2 : 1}
      />
      <Text style={styles.teamName} numberOfLines={2}>
        {team.name}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    hero: { paddingHorizontal: sizes.gutter, paddingBottom: 10, backgroundColor: colors.background },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
    iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginHorizontal: -10 },
    pressed: { opacity: 0.7 },
    label: { flex: 1, textAlign: 'center', fontSize: 14, lineHeight: 19, fontWeight: '600', color: colors.text, paddingHorizontal: 8 },
    scoreboard: { marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    column: { width: 96, alignItems: 'center', gap: 10 },
    teamName: { fontSize: 14, lineHeight: 18, fontWeight: '700', textAlign: 'center', color: colors.text },
    centerCol: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 2, gap: 4 },
    rates: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rate: { fontSize: 11, lineHeight: 15, fontVariant: ['tabular-nums'] },
    rateValue: { fontSize: 11, lineHeight: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
    scoreLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scoreNum: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
    scoreDim: { color: colors.textMuted },
    scoreDash: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.textMuted },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
    statusText: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8, color: colors.textMuted },
    statusLive: { color: colors.live, fontWeight: '700' },
    highlights: { marginTop: 18, alignItems: 'center', gap: 10 },
    summary: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
    eventRows: { width: '100%', gap: 8, marginTop: 2 },
    eventRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    eventName: { width: 130, textAlign: 'right', fontSize: 13, lineHeight: 18, fontWeight: '500' },
    eventIcon: { width: 10, height: 10, borderRadius: 5 },
    eventIconActive: { backgroundColor: colors.accent },
    eventIconIdle: { backgroundColor: colors.outline },
    amberPill: { minWidth: 52, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, backgroundColor: AMBER_PILL, alignItems: 'center' },
    amberText: { fontSize: 11, lineHeight: 15, fontWeight: '800', color: ON_AMBER, fontVariant: ['tabular-nums'] },
    chevronRow: { paddingTop: 2, alignItems: 'center' },
  });
