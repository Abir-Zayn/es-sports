import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBadge, AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { LiveMatchViewData } from '../live/live-view';
import type { LiveSide } from '../types';

type Props = {
  view: Pick<LiveMatchViewData, 'header' | 'sides' | 'summary' | 'currentRunRate' | 'requiredRunRate'>;
  onBack: () => void;
  onShare: () => void;
};

/** Top of the live screen: back and share, both teams with scores, and the chase, result or what comes next. */
export function LiveHero({ view, onBack, onShare }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [first, second] = view.sides;
  const status = view.header.status;
  const badge = status === 'live' ? { label: 'LIVE', background: colors.live, color: colors.onLive }
    : status === 'completed' ? { label: 'RESULT', background: colors.primarySoft, color: colors.link }
    : { label: 'UPCOMING', background: colors.surfaceRaised, color: colors.textMuted };
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
      <Svg width="100%" height={300} viewBox="0 0 390 300" preserveAspectRatio="xMidYMin slice" style={styles.art}>
        <Path d="M-20 260 C110 230 250 150 420 90 L420 120 C270 180 130 256 -20 284 Z" fill={colors.primary} opacity={0.08} />
      </Svg>

      <View style={styles.topRow}>
        <AppIconTile
          icon={ChevronLeft}
          size={44}
          borderRadius={radius.pill}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          borderWidth={1}
          accessibilityLabel="Back"
          onPress={onBack}
        />
        <Text accessibilityRole="header" style={styles.label} numberOfLines={1}>
          {view.header.label}
        </Text>
        <AppIconTile
          icon={Share2}
          size={44}
          borderRadius={radius.pill}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          borderWidth={1}
          iconSize={18}
          accessibilityLabel="Share match"
          onPress={onShare}
        />
      </View>

      <View style={styles.teams}>
        <TeamColumn side={first} />
        <View style={styles.middle}>
          <AppBadge dot={status === 'live'} label={badge.label} backgroundColor={badge.background} color={badge.color} />
          <Text style={styles.vs}>VS</Text>
        </View>
        <TeamColumn side={second} />
      </View>

      <View style={styles.chase}>
        <Text style={styles.target} accessibilityLiveRegion="polite">{view.summary}</Text>
        {status === 'scheduled' ? null : (
          <View style={styles.rates}>
            <Text muted style={styles.rate}>
              CRR <Text style={styles.rateValue}>{view.currentRunRate}</Text>
            </Text>
            {view.requiredRunRate !== null ? (
              <Text muted style={styles.rate}>
                RRR <Text style={styles.rateValue}>{view.requiredRunRate}</Text>
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function TeamColumn({ side }: { side: LiveSide }) {
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
        size={56}
        borderColor={batting ? colors.primary : undefined}
        borderWidth={batting ? 2 : 0}
      />
      <Text style={[styles.teamName, !batting && styles.dim]} numberOfLines={2}>
        {team.name}
      </Text>
      <Text style={[batting ? styles.scoreBig : styles.scoreSmall, !batting && styles.dim]}>{side.score}</Text>
      <Text muted style={styles.overs}>
        {side.overs}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    hero: {
      paddingHorizontal: sizes.gutter,
      paddingBottom: 22,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      overflow: 'hidden',
    },
    art: { position: 'absolute', top: 0, left: 0 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    label: { flex: 1, textAlign: 'center', fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1, color: colors.textMuted },
    teams: { marginTop: 20, flexDirection: 'row', alignItems: 'center' },
    column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
    middle: { width: 70, alignItems: 'center', gap: 8 },
    vs: { fontSize: 20, lineHeight: 24, fontWeight: '800', fontStyle: 'italic', color: colors.outline },
    teamName: { fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
    dim: { color: colors.textMuted },
    scoreBig: { fontSize: 36, lineHeight: 38, fontWeight: '800', fontVariant: ['tabular-nums'] },
    scoreSmall: { fontSize: 26, lineHeight: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
    overs: { fontSize: 12, lineHeight: 16 },
    chase: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryDeep,
    },
    target: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '700', color: colors.link },
    rates: { gap: 2 },
    rate: { fontSize: 12, lineHeight: 16 },
    rateValue: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.text },
  });
