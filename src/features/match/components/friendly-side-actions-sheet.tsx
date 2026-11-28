import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Search from 'lucide-react-native/icons/search';
import Unlink from 'lucide-react-native/icons/unlink';
import UserCheck from 'lucide-react-native/icons/user-check';
import UserPlus from 'lucide-react-native/icons/user-plus';
import UserSearch from 'lucide-react-native/icons/user-search';
import Users from 'lucide-react-native/icons/users';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { FriendlyMatchSetup, FriendlySide } from '../types';
import { SQUAD_MAX } from '../utils/friendly-rules';
import { teamLabel } from '../utils/toss';

type Props = {
  /** The side whose actions are open, or null when the sheet is closed. */
  side: FriendlySide | null;
  setup: FriendlyMatchSetup;
  onClose: () => void;
  onSearchTeams: (side: FriendlySide) => void;
  onUnlink: (side: FriendlySide) => void;
  onFind: (side: FriendlySide) => void;
  onQuickAdd: (side: FriendlySide) => void;
  /** Opens the squad: who plays, who sits out, and removing someone. */
  onSquad: (side: FriendlySide) => void;
  /** The add-me action for a side, or undefined while the creator is already in a squad. */
  addMe: (side: FriendlySide) => (() => void) | undefined;
};

type Action = { key: string; icon: ComponentType<{ size?: number; color?: string }>; title: string; detail: string; disabled?: boolean; run: () => void };

/** Everything one side can do, from the matchup card's "more" button. A choice closes this sheet, then opens its own. */
export function FriendlySideActionsSheet({ side, setup, onClose, onSearchTeams, onUnlink, onFind, onQuickAdd, onSquad, addMe }: Props) {
  const { t } = useTranslation();
  if (!side) return null;
  const squad = setup[side];
  const full = squad.players.length >= SQUAD_MAX;
  const fullText = t('friendly.actions.squadFull');
  const onAddMe = addMe(side);
  const actions: Action[] = [
    { key: 'squad', icon: Users, title: t('friendly.actions.squad'), detail: t('friendly.actions.squadDetail', { count: squad.players.length, playing: squad.players.filter((p) => p.playing).length }), run: () => onSquad(side) },
    squad.teamId
      ? { key: 'unlink', icon: Unlink, title: t('friendly.actions.unlink', { team: squad.name }), detail: t('friendly.actions.unlinkDetail'), run: () => onUnlink(side) }
      : { key: 'teams', icon: Search, title: t('friendly.actions.searchTeams'), detail: t('friendly.actions.searchTeamsDetail'), run: () => onSearchTeams(side) },
    { key: 'find', icon: UserSearch, title: t('friendly.actions.findPlayer'), detail: full ? fullText : t('friendly.actions.findPlayerDetail'), disabled: full, run: () => onFind(side) },
    { key: 'guest', icon: UserPlus, title: t('friendly.actions.quickAdd'), detail: full ? fullText : t('friendly.actions.quickAddDetail'), disabled: full, run: () => onQuickAdd(side) },
    ...(onAddMe && !full ? [{ key: 'me', icon: UserCheck, title: t('friendly.actions.addMe'), detail: t('friendly.actions.addMeDetail'), run: onAddMe }] : []),
  ];
  return (
    <Sheet visible title={t('friendly.actions.title', { label: teamLabel(setup, side) })} onClose={onClose}>
      <View style={{ gap: spacing.sm }}>
        {actions.map((action) => <ActionRow key={action.key} action={action} onDone={onClose} />)}
      </View>
    </Sheet>
  );
}

function ActionRow({ action, onDone }: { action: Action; onDone: () => void }) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const Icon = action.icon;
  // Closing unmounts this sheet at once, so only one sheet is ever open.
  const choose = () => { onDone(); action.run(); };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${action.title}. ${action.detail}`} accessibilityState={{ disabled: Boolean(action.disabled) }}
      disabled={action.disabled} onPress={choose} style={({ pressed }) => [s.row, action.disabled && s.disabled, pressed && s.pressed]}>
      <View style={s.icon}><Icon size={sizes.icon} color={colors.text} /></View>
      <View style={s.text}>
        <Text style={s.title}>{action.title}</Text>
        <Text muted style={s.detail}>{action.detail}</Text>
      </View>
      <ChevronRight size={sizes.icon} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  row: { minHeight: dp(64), flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  icon: { width: sizes.iconButton, height: sizes.iconButton, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.surface },
  text: { flex: 1, minWidth: 0, gap: dp(2) },
  title: typography.labelMd,
  detail: typography.bodySm,
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
});
