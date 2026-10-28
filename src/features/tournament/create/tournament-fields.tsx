import GitBranch from 'lucide-react-native/icons/git-branch';
import MapPin from 'lucide-react-native/icons/map-pin';
import Plus from 'lucide-react-native/icons/plus';
import Users from 'lucide-react-native/icons/users';
import Volleyball from 'lucide-react-native/icons/volleyball';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { CoverPicker, ProfilePhotoPicker } from './cover-picker';
import { DatePicker } from './date-picker';
import { competitionFormats, matchFormats, teamCounts, type DraftErrors, type TournamentDraft } from './draft';
import { CardDivider, SelectionField, SettingsCard } from './settings-card';

type Props = {
  draft: TournamentDraft; errors: DraftErrors; onBusyChange: (busy: boolean) => void; onAddTeams: () => void;
  onChange: <K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) => void;
};

export function TournamentFields({ draft, errors, onChange, onBusyChange, onAddTeams }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [photoError, setPhotoError] = useState('');
  return <View style={styles.stack}>
    <View>
      <View style={styles.artwork}>
        <CoverPicker uri={draft.coverUri} onChange={(uri) => onChange('coverUri', uri)} onBusyChange={onBusyChange} onError={setPhotoError} />
        <ProfilePhotoPicker uri={draft.profileUri} onChange={(uri) => onChange('profileUri', uri)} onBusyChange={onBusyChange} onError={setPhotoError} />
      </View>
      {photoError ? <Text variant="caption" accessibilityRole="alert" style={styles.error}>{photoError}</Text> : null}
    </View>
    <View style={styles.nameWrap}>
      <TextInput accessibilityLabel="Tournament name" placeholder="Tournament name…" placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary} value={draft.name} onChangeText={(name) => onChange('name', name)} maxLength={80}
        multiline autoCapitalize="words" style={styles.name} />
      {errors.name ? <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">{errors.name}</Text> : null}
    </View>
    <SettingsCard>
      <DatePicker label="Start date" value={draft.startDate} onChange={(value) => onChange('startDate', value)} error={errors.startDate} />
      <CardDivider />
      <DatePicker label="End date" value={draft.endDate} minimumDate={draft.startDate} onChange={(value) => onChange('endDate', value)} error={errors.endDate} />
    </SettingsCard>
    <SettingsCard>
      <View style={styles.locationHeading}><MapPin size={20} color={colors.textMuted} strokeWidth={1.6} /><Text>Tournament location</Text></View>
      <TextInput accessibilityLabel="City or area" placeholder="City or area" placeholderTextColor={colors.textMuted} value={draft.city}
        onChangeText={(value) => onChange('city', value)} maxLength={60} autoCapitalize="words" style={styles.locationInput} />
      <CardDivider />
      <TextInput accessibilityLabel="Ground or venue" placeholder="Add ground or venue" placeholderTextColor={colors.textMuted} value={draft.venue}
        onChangeText={(value) => onChange('venue', value)} maxLength={80} autoCapitalize="words" style={styles.locationInput} />
      {errors.city || errors.venue ? <Text variant="caption" style={[styles.error, styles.locationError]} accessibilityLiveRegion="polite">{errors.city ?? errors.venue}</Text> : null}
    </SettingsCard>
    <SettingsCard>
      <SelectionField label="Match format" icon={Volleyball} value={draft.matchFormat} options={matchFormats.map((value) => ({ value, label: value }))} onChange={(value) => onChange('matchFormat', value)} />
      <CardDivider />
      <SelectionField label="Knockout type" icon={GitBranch} value={draft.competition} options={competitionFormats} onChange={(value) => onChange('competition', value)} />
      <CardDivider />
      <SelectionField label="Number of teams" icon={Users} value={draft.teams} options={teamCounts.map((value) => ({ value, label: `${value} teams` }))} onChange={(value) => onChange('teams', value)} />
      {errors.teams ? <Text variant="caption" style={[styles.error, styles.locationError]} accessibilityLiveRegion="polite">{errors.teams}</Text> : null}
    </SettingsCard>
    <SettingsCard>
      <Pressable accessibilityRole="button" accessibilityLabel="Add teams and staff" onPress={onAddTeams}
        style={({ pressed }) => [styles.addTeams, pressed && styles.pressed]}>
        <Users size={20} color={colors.textMuted} strokeWidth={1.6} />
        <View style={styles.addCopy}><Text>Add teams</Text><Text variant="caption" muted>Create teams, invite team owners and moderators</Text></View>
        <Plus size={19} color={colors.link} />
      </Pressable>
    </SettingsCard>
    <Text variant="caption" muted style={styles.note}>Save a private draft on this device. Your tournament is not published yet.</Text>
  </View>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  stack: { gap: spacing.xl }, nameWrap: { gap: spacing.sm },
  artwork: { paddingBottom: 28 },
  name: { fontSize: 20, lineHeight: 28, fontWeight: '500', color: colors.text, paddingVertical: spacing.sm, paddingHorizontal: 0, minHeight: 48, textAlignVertical: 'center' },
  locationHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: 0 },
  locationInput: { minHeight: 54, fontSize: 16, color: colors.text, marginLeft: 48, paddingRight: spacing.lg, paddingVertical: spacing.md },
  error: { color: colors.dangerSoftText }, locationError: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  addTeams: { minHeight: 76, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, addCopy: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.65 },
  note: { textAlign: 'center', paddingHorizontal: spacing.lg },
});
