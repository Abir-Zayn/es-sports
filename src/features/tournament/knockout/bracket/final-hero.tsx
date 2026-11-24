import Trophy from 'lucide-react-native/icons/trophy';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { timeLabel } from '../../schedule-builder/slots';
import type { BracketMatch, BracketSide } from './bracket-model';
import { dayLabel } from './bracket-format';

type Props = { final: BracketMatch | null; champion: string | null; onOpen?: () => void };

/** The top of the Knockout tab: the final with the trophy between the finalists, or the champion once it is decided. */
export function FinalHero({ final, champion, onOpen }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const status = !final ? 'The winners of the semi-finals meet here'
    : final.state === 'live' ? 'Live now'
      : final.state === 'result' || final.state === 'cancelled' ? (final.note ?? '')
        : `${dayLabel(final.date)} · ${timeLabel(final.startMin)}`;
  const side = (s: BracketSide | undefined, align: 'left' | 'right') => (
    <View style={[styles.side, align === 'right' && styles.sideRight]}>
      <View style={s && !s.won && final?.state === 'result' ? styles.faded : null}>
        <InitialsAvatar label={s?.code ?? 'TBD'} tone={s?.team?.tone ?? 'neutral'} imageUri={s?.team?.logoUrl ?? undefined} size={dp(52)} shape="square" />
      </View>
      {/* The logo slot already shows the code when there is no logo, so the name goes under it. */}
      <Text style={[styles.code, align === 'right' && styles.right, s?.won && styles.won]} numberOfLines={2}>{s?.team?.name ?? s?.name ?? 'To be decided'}</Text>
      {s?.score ? <Text style={[styles.score, s.won && styles.won]}>{s.score}</Text> : null}
    </View>
  );
  const label = champion ? `${champion} are the champions` : final
    ? `Final, ${final.sides[0].name} against ${final.sides[1].name}. ${status}` : `Final. ${status}`;

  return (
    <Pressable accessibilityRole={onOpen ? 'button' : undefined} accessibilityLabel={label} disabled={!onOpen} onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {champion ? (
        <View style={styles.banner}>
          <Trophy size={sizes.iconSmall} color={colors.accent} />
          <Text style={styles.bannerText} numberOfLines={1}>{`${champion} are the champions`}</Text>
        </View>
      ) : <Text style={styles.kicker}>FINAL</Text>}
      <View style={styles.row}>
        {side(final?.sides[0], 'left')}
        <View style={styles.trophy}><Trophy size={dp(34)} color={champion ? colors.accent : colors.textMuted} strokeWidth={1.5} /></View>
        {side(final?.sides[1], 'right')}
      </View>
      {status ? <Text style={styles.status} numberOfLines={2}>{status}</Text> : null}
    </Pressable>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: sizes.cardPaddingTight, gap: spacing.md, alignItems: 'center', ...shadows.card },
  pressed: { opacity: 0.85 },
  kicker: { ...typography.labelUppercase, color: colors.textMuted },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: dp(4) },
  bannerText: { ...typography.labelMd, color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  side: { flex: 1, alignItems: 'flex-start', gap: spacing.xs },
  sideRight: { alignItems: 'flex-end' },
  faded: { opacity: 0.45 },
  code: { ...typography.labelMd, color: colors.textMuted },
  right: { textAlign: 'right' },
  score: { ...typography.bodyMd, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  won: { color: colors.text, fontWeight: '700' },
  trophy: { width: dp(64), height: dp(64), borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  status: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center' },
});
