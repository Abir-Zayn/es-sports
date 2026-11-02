import UserCheck from 'lucide-react-native/icons/user-check';
import UserPlus from 'lucide-react-native/icons/user-plus';
import UserSearch from 'lucide-react-native/icons/user-search';
import Users from 'lucide-react-native/icons/users';
import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { SQUAD_MAX } from '../friendly/friendly-rules';
import type { FriendlyPlayer, FriendlyTeamSquad } from '../types';
import { FriendlySquadSheet } from './friendly-squad-sheet';
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

/** One side of a friendly: image, name and lineup count stacked in the centre, then icon tiles to add players or open the squad. */
export function FriendlyTeamCard({ label, squad, playersPerSide, error, onAddMe, onRename, onImage, onTogglePlaying, onRemove, onFind, onQuickAdd }: Props) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const [squadOpen, setSquadOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const playing = squad.players.filter((p) => p.playing).length;
  const full = squad.players.length >= SQUAD_MAX;
  const title = squad.name.trim() || label;
  return <View style={[s.card, error ? s.cardError : null]}>
    <TeamImagePicker label={label} uri={squad.imageUri} size={72} onChange={onImage} />
    <TextInput value={squad.name} onChangeText={onRename} placeholder={`${label} name`} accessibilityLabel={`${label} name`}
      maxLength={30} autoCapitalize="words" placeholderTextColor={colors.textMuted} selectionColor={colors.primary}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={[s.input, focused ? s.inputFocused : null, error ? s.inputError : null]} />
    <Text muted style={s.count}>{playing}/{playersPerSide} Playing · {squad.players.length}/{SQUAD_MAX} Squad</Text>
    {error && !squadOpen ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    <View style={s.actions}>
      <ActionTile icon={UserSearch} accessibilityLabel={`Find player for ${label}`} disabled={full} onPress={onFind} />
      <ActionTile icon={UserPlus} accessibilityLabel={`Quick add to ${label}`} disabled={full} onPress={onQuickAdd} />
      {onAddMe && !full ? <ActionTile icon={UserCheck} accessibilityLabel={`Add me to ${label}`} onPress={onAddMe} /> : null}
      <ActionTile icon={Users} accessibilityLabel={`Show ${label} squad`} onPress={() => setSquadOpen(true)} />
    </View>
    <FriendlySquadSheet visible={squadOpen} title={`${title} squad`} squad={squad} playersPerSide={playersPerSide}
      error={squadOpen ? error : undefined} onClose={() => setSquadOpen(false)} onTogglePlaying={onTogglePlaying} onRemove={onRemove} />
  </View>;
}

type TileProps = { icon: ComponentType<{ size?: number; color?: string }>; accessibilityLabel: string; disabled?: boolean; onPress: () => void };

/** A square icon tile. Stays visible and announced as disabled when the squad is full. */
function ActionTile({ icon: Icon, accessibilityLabel, disabled = false, onPress }: TileProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [s.tile, disabled && s.disabled, pressed && s.pressed]}>
    <Icon size={22} color={colors.text} />
  </Pressable>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md, padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  cardError: { borderColor: c.danger },
  input: {
    alignSelf: 'stretch', height: 52, paddingHorizontal: spacing.xl, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.background, color: c.text, fontSize: 16, fontWeight: '600', textAlign: 'center', paddingVertical: 0,
  },
  inputFocused: { borderColor: c.primary },
  inputError: { borderColor: c.danger },
  count: { fontSize: 13, lineHeight: 18, fontWeight: '600', textAlign: 'center', fontVariant: ['tabular-nums'] },
  error: { fontSize: 13, lineHeight: 18, color: c.danger, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xs },
  tile: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceRaised,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
