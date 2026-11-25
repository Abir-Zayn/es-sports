import UserCheck from 'lucide-react-native/icons/user-check';
import UserPlus from 'lucide-react-native/icons/user-plus';
import UserSearch from 'lucide-react-native/icons/user-search';
import Users from 'lucide-react-native/icons/users';
import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { SQUAD_MAX } from '../utils/friendly-rules';
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
  /** Play this side as one of your existing teams, or stop. */
  onUseTeam?: () => void;
  onUnlink?: () => void;
};

/** One side of a friendly: image, name and lineup count stacked in the centre, then icon tiles to add players or open the squad. */
export function FriendlyTeamCard({ label, squad, playersPerSide, error, onAddMe, onRename, onImage, onTogglePlaying, onRemove, onFind, onQuickAdd, onUseTeam, onUnlink }: Props) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [squadOpen, setSquadOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const playing = squad.players.filter((p) => p.playing).length;
  const full = squad.players.length >= SQUAD_MAX;
  const title = squad.name.trim() || label;
  return <View style={[s.card, error ? s.cardError : null]}>
    <TeamImagePicker label={label} uri={squad.imageUri} size={dp(72)} onChange={onImage} />
    <TextInput value={squad.name} onChangeText={onRename} placeholder={t('friendly.team.namePlaceholder', { label })} accessibilityLabel={t('friendly.team.namePlaceholder', { label })}
      maxLength={30} autoCapitalize="words" placeholderTextColor={colors.textMuted} selectionColor={colors.primary}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={[s.input, focused ? s.inputFocused : null, error ? s.inputError : null]} />
    <Text muted style={s.count}>{t('friendly.team.count', { playing, playersPerSide, total: squad.players.length, squadMax: SQUAD_MAX })}</Text>
    {squad.teamId ? (
      <View style={s.linked}>
        <Text style={s.linkedText} numberOfLines={1}>{`Linked to ${squad.name}`}</Text>
        {onUnlink ? <Button label="Unlink" variant="ghost" size="compact" accessibilityLabel={`Stop playing ${label} as ${squad.name}`} onPress={onUnlink} /> : null}
      </View>
    ) : onUseTeam ? <Button label="Use my team" variant="secondary" size="compact" accessibilityLabel={`Play ${label} as one of my teams`} onPress={onUseTeam} /> : null}
    {error && !squadOpen ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    <View style={s.actions}>
      <ActionTile icon={UserSearch} accessibilityLabel={t('friendly.team.findPlayerA11y', { label })} disabled={full} onPress={onFind} />
      <ActionTile icon={UserPlus} accessibilityLabel={t('friendly.team.quickAddA11y', { label })} disabled={full} onPress={onQuickAdd} />
      {onAddMe && !full ? <ActionTile icon={UserCheck} accessibilityLabel={t('friendly.team.addMeA11y', { label })} onPress={onAddMe} /> : null}
      <ActionTile icon={Users} accessibilityLabel={t('friendly.team.showSquadA11y', { label })} onPress={() => setSquadOpen(true)} />
    </View>
    <FriendlySquadSheet visible={squadOpen} title={t('friendly.team.squadTitle', { title })} squad={squad} playersPerSide={playersPerSide}
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
    <Icon size={sizes.icon} color={colors.text} />
  </Pressable>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md, padding: sizes.cardPaddingTight, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  // Keeps the validation outline the card had before it lost its hairline border.
  cardError: { borderWidth: 2, borderColor: c.danger },
  input: {
    ...typography.labelMd, alignSelf: 'stretch', height: sizes.field, paddingHorizontal: dp(20), borderRadius: radius.md, borderWidth: 2,
    borderColor: 'transparent', backgroundColor: c.surfaceRaised, color: c.text, textAlign: 'center', paddingVertical: 0, lineHeight: undefined,
  },
  inputFocused: { borderColor: c.primaryTint },
  inputError: { borderColor: c.danger },
  count: { ...typography.bodySm, textAlign: 'center', fontVariant: ['tabular-nums'] },
  linked: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  linkedText: { ...typography.labelSm, color: c.link, flexShrink: 1 },
  error: { ...typography.bodySm, color: c.danger, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xs },
  tile: { width: sizes.control, height: sizes.control, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.surfaceRaised },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.95 }] },
});
