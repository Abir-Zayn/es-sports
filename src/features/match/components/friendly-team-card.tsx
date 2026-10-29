import X from 'lucide-react-native/icons/x';
import Check from 'lucide-react-native/icons/check';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIconTile, Button, InitialsAvatar, Text, TextField } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

import { SQUAD_MAX } from '../friendly/friendly-rules';
import type { FriendlyPlayer, FriendlyTeamSquad } from '../types';
import { TeamImagePicker } from './team-image-picker';

type Props = {
  label: string;
  squad: FriendlyTeamSquad;
  playersPerSide: number;
  error?: string;
  /** Shown while the creator is in neither squad. */
  onAddMe?: () => void;
  onRename: (name: string) => void;
  onImage: (uri?: string, mimeType?: string) => void;
  onTogglePlaying: (player: FriendlyPlayer) => void;
  onRemove: (player: FriendlyPlayer) => void;
  onFind: () => void;
  onQuickAdd: () => void;
};

/** One side of a friendly: name and colour, its lineup with playing and bench, and the two ways to add players. */
export function FriendlyTeamCard({ label, squad, playersPerSide, error, onAddMe, onRename, onImage, onTogglePlaying, onRemove, onFind, onQuickAdd }: Props) {
  const s = useThemedStyles(styles);
  const playing = squad.players.filter((p) => p.playing).length;
  const full = squad.players.length >= SQUAD_MAX;
  const hasReserves = squad.players.length > playersPerSide;
  return <View style={s.card}>
    <View style={s.top}>
      <TeamImagePicker label={label} uri={squad.imageUri} onChange={onImage} />
      <View style={s.name}><TextField label={`${label} name`} value={squad.name} onChangeText={onRename} placeholder="e.g. Karnaphuli Kings" maxLength={30} autoCapitalize="words" /></View>
    </View>
    <Text muted style={s.count}>{playing}/{playersPerSide} playing · {squad.players.length}/{SQUAD_MAX} in squad</Text>
    {hasReserves ? <Text muted style={s.detail}>Select the players in the lineup.</Text> : null}
    {squad.players.length === 0 ? <Text muted style={s.empty}>No players yet. Find app users or quick add guests.</Text> : null}
    {squad.players.map((p) => <View key={p.id} style={s.player}>
      <InitialsAvatar label={initialsOf(p.name)} imageUri={p.avatarUrl} size={36} />
      <View style={s.who}>
        <Text style={s.playerName} numberOfLines={1}>{p.name}</Text>
        <Text muted style={s.detail}>{p.role} · {p.userId ? 'App user' : 'Guest'}</Text>
      </View>
      {hasReserves ? <Pressable accessibilityRole="switch" accessibilityState={{ checked: p.playing }} accessibilityLabel={`${p.name} playing`}
        onPress={() => onTogglePlaying(p)} style={s.selection}>
        <View style={[s.box, p.playing && s.boxOn]}>{p.playing ? <Check size={16} color={s.check.color} /> : null}</View>
      </Pressable> : null}
      <AppIconTile icon={X} size={36} borderRadius={radius.pill} accessibilityLabel={`Remove ${p.name}`} onPress={() => onRemove(p)} />
    </View>)}
    {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    <View style={s.actions}>
      <View style={s.action}><Button label="Find player" size="compact" variant="secondary" disabled={full} accessibilityLabel={`Find player for ${label}`} onPress={onFind} /></View>
      <View style={s.action}><Button label="Quick add" size="compact" variant="secondary" disabled={full} accessibilityLabel={`Quick add to ${label}`} onPress={onQuickAdd} /></View>
    </View>
    {onAddMe && !full ? <Button label="Add me to this team" size="compact" variant="ghost" accessibilityLabel={`Add me to ${label}`} onPress={onAddMe} /> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  name: { flex: 1 },
  count: { fontSize: 12, lineHeight: 17 },
  empty: { fontSize: 13, lineHeight: 18 },
  player: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  who: { flex: 1, minWidth: 0 },
  playerName: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  detail: { fontSize: 12, lineHeight: 16 },
  selection: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: c.primary, backgroundColor: c.primary },
  check: { color: c.primaryText },
  error: { fontSize: 13, lineHeight: 18, color: c.danger },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
