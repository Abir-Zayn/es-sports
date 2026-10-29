import Check from 'lucide-react-native/icons/check';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SegmentedControl, Text } from '@/components/ui';
import { playerRoles, Sheet, UserSearchSheet, type PlayerRole, type UserSummary } from '@/features/tournament/roster';
import { AddGuestSheet } from '@/features/tournament/squad';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { FriendlyMatchSetup, FriendlySide } from '../types';

export type FriendlySheet = { kind: 'find' | 'guest'; side: FriendlySide } | { kind: 'scorer' } | null;

type Props = {
  sheet: FriendlySheet;
  /** Why the last add was refused, shown inside the open sheet. */
  error: string | null;
  meId: string;
  setup: FriendlyMatchSetup;
  onClose: () => void;
  onAddMember: (side: FriendlySide, user: UserSummary, role: PlayerRole) => void;
  onAddGuest: (side: FriendlySide, input: { name: string; phone: string; role: PlayerRole }) => void;
  onPickScorer: (userId: string) => void;
};

const roleOptions = playerRoles.map((id) => ({ id, label: id === 'All-rounder' ? 'All-round' : id }));
const sideName = (setup: FriendlyMatchSetup, side: FriendlySide) => setup[side].name.trim() || (side === 'teamA' ? 'Team A' : 'Team B');

/**
 * The sheets of friendly setup: find an app user, quick add a guest, or choose the scorer. People already in
 * either squad are left out of search, since one person plays for one side.
 */
export function FriendlySheets({ sheet, error, meId, setup, onClose, onAddMember, onAddGuest, onPickScorer }: Props) {
  const [role, setRole] = useState<PlayerRole>('Batter');
  const everyone = [...setup.teamA.players, ...setup.teamB.players];
  const taken = everyone.flatMap((p) => (p.userId ? [p.userId] : []));
  const side = sheet && sheet.kind !== 'scorer' ? sheet.side : 'teamA';
  return <>
    <UserSearchSheet visible={sheet?.kind === 'find'} title={`Add to ${sideName(setup, side)}`}
      hint="Find a player on esSports. Their runs and wickets from this match go on their profile."
      excludeIds={taken} inviting={false} error={error} actionLabel="Add" onClose={onClose}
      onInvite={(user) => onAddMember(side, user, role)}>
      <SegmentedControl options={roleOptions} selected={role} onSelect={setRole} accessibilityLabel="Playing role" />
    </UserSearchSheet>
    <AddGuestSheet visible={sheet?.kind === 'guest'} locked={false} adding={false} error={error} onClose={onClose}
      note={`Adds a guest to ${sideName(setup, side)}. Their figures stay with this match.`}
      onAdd={(input) => onAddGuest(side, input)} />
    <Sheet visible={sheet?.kind === 'scorer'} title="Choose scorer" onClose={onClose}>
      <ScorerOptions meId={meId} setup={setup} onPick={onPickScorer} />
    </Sheet>
  </>;
}

function ScorerOptions({ meId, setup, onPick }: { meId: string; setup: FriendlyMatchSetup; onPick: (id: string) => void }) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const current = setup.assignedScorerId || meId;
  const members = [...setup.teamA.players, ...setup.teamB.players].filter((p) => p.userId && p.userId !== meId);
  const options = [{ id: meId, name: 'You', detail: 'Score on this phone' },
    ...members.map((p) => ({ id: p.userId ?? '', name: p.name, detail: 'App user in a squad' }))];
  return <View style={s.list}>
    {options.map((o) => <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: o.id === current }}
      accessibilityLabel={`Scorer ${o.name}`} onPress={() => onPick(o.id)} style={[s.option, o.id === current && s.on]}>
      <View style={s.text}><Text style={s.name}>{o.name}</Text><Text muted style={s.detail}>{o.detail}</Text></View>
      {o.id === current ? <Check size={20} color={colors.link} /> : null}
    </Pressable>)}
    {members.length === 0 ? <Text muted style={s.detail}>Add app users to a squad to hand scoring to one of them.</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 14, borderWidth: 1, borderColor: c.border },
  on: { borderColor: c.primary, backgroundColor: c.primarySoft },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 17 },
});
