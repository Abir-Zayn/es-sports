import Check from 'lucide-react-native/icons/check';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SegmentedControl, Text } from '@/components/ui';
import { playerRoles, Sheet, UserSearchSheet, type PlayerRole, type UserSummary } from '@/features/tournament/roster';
import { AddGuestSheet } from '@/features/tournament/squad';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { searchPlayers } from '../server/search-players';
import { roleLabel } from '../utils/match-details';
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

/**
 * The sheets of friendly setup: find an app user, quick add a guest, or choose the scorer. People already in
 * either squad are left out of search, since one person plays for one side.
 */
export function FriendlySheets({ sheet, error, meId, setup, onClose, onAddMember, onAddGuest, onPickScorer }: Props) {
  const { t, locale } = useTranslation();
  const [role, setRole] = useState<PlayerRole>('Batter');
  const everyone = [...setup.teamA.players, ...setup.teamB.players];
  const taken = everyone.flatMap((p) => (p.userId ? [p.userId] : []));
  const side = sheet && sheet.kind !== 'scorer' ? sheet.side : 'teamA';
  const sideName = setup[side].name.trim() || (side === 'teamA' ? t('friendly.teamA') : t('friendly.teamB'));
  const roleOptions = playerRoles.map((id) => ({
    id,
    label: id === 'All-rounder' ? t('friendly.sheets.allRound') : roleLabel(id, locale),
  }));
  return <>
    <UserSearchSheet visible={sheet?.kind === 'find'} title={t('friendly.sheets.addToTitle', { team: sideName })}
      hint={t('friendly.sheets.findHint')}
      search={searchPlayers} excludeIds={taken} inviting={false} error={error} actionLabel={t('friendly.sheets.addLabel')} onClose={onClose}
      onInvite={(user) => onAddMember(side, user, role)}>
      <SegmentedControl options={roleOptions} selected={role} onSelect={setRole} accessibilityLabel={t('friendly.sheets.playingRoleA11y')} />
    </UserSearchSheet>
    <AddGuestSheet visible={sheet?.kind === 'guest'} locked={false} adding={false} error={error} onClose={onClose}
      note={t('friendly.sheets.guestNote', { team: sideName })}
      onAdd={(input) => onAddGuest(side, input)} />
    <Sheet visible={sheet?.kind === 'scorer'} title={t('friendly.sheets.chooseScorer')} onClose={onClose}>
      <ScorerOptions meId={meId} setup={setup} onPick={onPickScorer} />
    </Sheet>
  </>;
}

function ScorerOptions({ meId, setup, onPick }: { meId: string; setup: FriendlyMatchSetup; onPick: (id: string) => void }) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const current = setup.assignedScorerId || meId;
  const members = [...setup.teamA.players, ...setup.teamB.players].filter((p) => p.userId && p.userId !== meId);
  const options = [{ id: meId, name: t('friendly.you'), detail: t('friendly.sheets.youDetail') },
    ...members.map((p) => ({ id: p.userId ?? '', name: p.name, detail: t('friendly.sheets.memberDetail') }))];
  return <View style={s.list}>
    {options.map((o) => <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: o.id === current }}
      accessibilityLabel={t('friendly.sheets.scorerOptionA11y', { name: o.name })} onPress={() => onPick(o.id)} style={[s.option, o.id === current && s.on]}>
      <View style={s.text}><Text style={s.name}>{o.name}</Text><Text muted style={s.detail}>{o.detail}</Text></View>
      {o.id === current ? <Check size={sizes.icon} color={colors.link} /> : null}
    </Pressable>)}
    {members.length === 0 ? <Text muted style={s.detail}>{t('friendly.sheets.noMembers')}</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  option: {
    minHeight: dp(56), flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg,
    borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: c.surfaceRaised,
  },
  on: { borderColor: c.primary, backgroundColor: c.primarySoft },
  text: { flex: 1, gap: dp(2) },
  name: typography.headlineMd,
  detail: typography.bodySm,
});
