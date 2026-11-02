import Check from 'lucide-react-native/icons/check';
import X from 'lucide-react-native/icons/x';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { initialsOf } from '@/lib/initials';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { FriendlyPlayer, FriendlyTeamSquad } from '../types';

type Props = {
  visible: boolean;
  title: string;
  squad: FriendlyTeamSquad;
  playersPerSide: number;
  /** Why the last lineup change was refused. */
  error?: string;
  onClose: () => void;
  onTogglePlaying: (player: FriendlyPlayer) => void;
  onRemove: (player: FriendlyPlayer) => void;
};

/** One side's squad in a sheet, so the card stays short: who is in it, who plays, and removing someone. */
export function FriendlySquadSheet({ visible, title, squad, playersPerSide, error, onClose, onTogglePlaying, onRemove }: Props) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const hasReserves = squad.players.length > playersPerSide;
  return <Sheet visible={visible} title={title} onClose={onClose}>
    {hasReserves ? <Text muted style={s.detail}>Select the players in the lineup.</Text> : null}
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    {squad.players.length === 0 ? <View style={s.empty}>
      <Text muted style={s.emptyText}>No players yet. Find app users or quick add guests.</Text>
    </View> : <ScrollView style={s.list} contentContainerStyle={s.listContent}>
      {squad.players.map((p, index) => <View key={p.id} style={[s.player, index > 0 ? s.divided : null]}>
        <InitialsAvatar label={initialsOf(p.name)} imageUri={p.avatarUrl} size={40} tone={p.userId ? 'blue' : 'neutral'} />
        <View style={[s.who, hasReserves && !p.playing ? s.bench : null]}>
          <Text style={s.name} numberOfLines={1}>{p.name}</Text>
          <Text muted style={s.detail}>{p.role} · {p.userId ? 'App user' : 'Guest'}</Text>
        </View>
        {hasReserves ? <Pressable accessibilityRole="switch" accessibilityState={{ checked: p.playing }} accessibilityLabel={`${p.name} playing`}
          onPress={() => onTogglePlaying(p)} style={s.selection}>
          <View style={[s.box, p.playing && s.boxOn]}>{p.playing ? <Check size={14} color={colors.primaryText} strokeWidth={3} /> : null}</View>
        </Pressable> : null}
        <AppIconTile icon={X} size={36} borderRadius={radius.pill} accessibilityLabel={`Remove ${p.name}`} onPress={() => onRemove(p)} />
      </View>)}
    </ScrollView>}
  </Sheet>;
}

const styles = (c: Palette) => StyleSheet.create({
  detail: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  error: { fontSize: 13, lineHeight: 18, color: c.danger },
  empty: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: c.outline },
  emptyText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  list: { flexGrow: 0, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  listContent: { paddingHorizontal: spacing.md },
  player: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  bench: { opacity: 0.75 },
  who: { flex: 1, minWidth: 0, gap: 1 },
  name: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  selection: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { width: 24, height: 24, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.outline, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: c.primary, backgroundColor: c.primary },
});
