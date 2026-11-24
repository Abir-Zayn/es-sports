import Check from 'lucide-react-native/icons/check';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppBadge, AppTabs, Button, InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { timeLabel } from '../../schedule-builder/slots';
import { dayLabel } from './bracket-format';
import type { Bracket, BracketMatch, KnockoutStage } from './bracket-model';

type Decide = { pending: { fixtureId: string; winnerId: string } | null; onDecide: (fixtureId: string, winnerId: string) => void };
type Props = Decide & {
  bracket: Bracket; selected: KnockoutStage; onSelect: (stage: KnockoutStage) => void; isOwner: boolean;
  onOpen: (match: BracketMatch) => void;
};

/** Round chips, then every match of the chosen round in full: teams, scores, when, the result and the owner's decision. */
export function StageMatches({ bracket, selected, onSelect, isOwner, onOpen, pending, onDecide }: Props) {
  const styles = useThemedStyles(createStyles);
  const stage = bracket.stages.find((s) => s.name === selected) ?? bracket.stages[0];
  if (!stage) return null;
  return (
    <View style={styles.gap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        <AppTabs tabs={bracket.stages.map((s) => ({ id: s.name, label: s.name }))} selected={stage.name} onSelect={onSelect} />
      </ScrollView>
      {stage.matches.map((m) => (
        <MatchCard key={m.id} match={m} canDecide={isOwner} onOpen={() => onOpen(m)} pending={pending} onDecide={onDecide} />
      ))}
    </View>
  );
}

function MatchCard({ match: m, canDecide, onOpen, pending, onDecide }: Decide & { match: BracketMatch; canDecide: boolean; onOpen: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const badge = {
    live: { label: 'Live', backgroundColor: colors.dangerSoft, color: colors.dangerSoftText },
    result: { label: 'Result', backgroundColor: colors.successSoft, color: colors.success },
    cancelled: { label: 'Called off', backgroundColor: colors.surfaceRaised, color: colors.textMuted },
    upcoming: { label: `${dayLabel(m.date)} · ${timeLabel(m.startMin)}`, backgroundColor: colors.surfaceRaised, color: colors.text },
  }[m.state];
  const decided = m.sides.some((s) => s.won);
  const first = m.sides.find((s) => s.team?.id === m.suggestedWinnerId) ?? m.sides[0];
  const choices = first === m.sides[0] ? m.sides : [m.sides[1], m.sides[0]];
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole={m.matchId ? 'button' : undefined} disabled={!m.matchId} onPress={onOpen}
        accessibilityLabel={`${m.label}. ${m.sides.map((s) => `${s.name}${s.score ? ` ${s.score}` : ''}${s.won ? ', through' : ''}`).join(' against ')}. ${m.note ?? badge.label}`}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        <View style={styles.head}>
          <Text style={styles.label}>{m.label.toUpperCase()}</Text>
          <AppBadge label={badge.label} dot={m.state === 'live'} backgroundColor={badge.backgroundColor} color={badge.color} />
        </View>
        {m.sides.map((s, i) => (
          <View key={i} style={styles.side}>
            <View style={decided && !s.won ? styles.faded : null}>
              <InitialsAvatar label={s.code} tone={s.team?.tone ?? 'neutral'} imageUri={s.team?.logoUrl ?? undefined} size={dp(32)} shape="square" />
            </View>
            <Text numberOfLines={1} style={[styles.name, !s.team && styles.tbd, decided && !s.won && styles.loser, s.won && styles.winner]}>{s.name}</Text>
            {s.score ? <Text style={[styles.score, s.won ? styles.winner : styles.loser]}>{s.score}</Text> : null}
            {s.overs ? <Text style={styles.overs}>{`(${s.overs})`}</Text> : null}
            {s.won ? <Check size={sizes.iconSmall} color={colors.success} accessibilityElementsHidden /> : null}
          </View>
        ))}
        {m.note ? <Text style={styles.note} numberOfLines={2}>{m.note}</Text> : null}
      </Pressable>
      {canDecide && m.awaitingDecision ? (
        <View style={styles.decide}>
          <Text style={styles.decideText}>{m.state === 'result' ? 'Confirm who goes through.' : 'No winner on the field. Choose who goes through.'}</Text>
          {choices.map((s) => s.team ? (
            <Button key={s.team.id} label={`${s.team.name} goes through`} variant={s === first ? 'primary' : 'secondary'}
              loading={pending?.fixtureId === m.id && pending.winnerId === s.team.id} onPress={() => s.team && onDecide(m.id, s.team.id)} />
          ) : null)}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  // The chips scroll edge to edge while the cards keep the gutter.
  chipScroll: { marginHorizontal: -sizes.gutter, flexGrow: 0 },
  chips: { paddingHorizontal: sizes.gutter },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.card, overflow: 'hidden' },
  body: { padding: sizes.cardPaddingTight, gap: spacing.sm },
  pressed: { opacity: 0.75 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  label: { ...typography.labelUppercase, color: colors.textMuted },
  side: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: dp(36) },
  faded: { opacity: 0.45 },
  name: { ...typography.bodyMd, color: colors.text, flex: 1, minWidth: 0 },
  tbd: { color: colors.textMuted, fontStyle: 'italic' },
  winner: { color: colors.text, fontWeight: '700' },
  loser: { color: colors.textMuted },
  score: { ...typography.bodyMd, fontVariant: ['tabular-nums'] },
  overs: { ...typography.bodySm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  note: { ...typography.bodySm, color: colors.textMuted, marginTop: spacing.xs },
  decide: { gap: spacing.sm, padding: sizes.cardPaddingTight, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.accentSoft },
  decideText: { ...typography.labelMd, color: colors.accent },
});
