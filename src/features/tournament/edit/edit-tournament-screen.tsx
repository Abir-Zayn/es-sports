import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Volleyball from 'lucide-react-native/icons/volleyball';
import X from 'lucide-react-native/icons/x';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { CoverPicker, ProfilePhotoPicker } from '../create/cover-picker';
import { DatePicker } from '../create/date-picker';
import { localDateKey, OVERS, oversFormatName, oversPresets, type DraftErrors } from '../create/draft';
import { NumberChoiceField } from '../create/number-choice-field';
import { CardDivider, SettingsCard } from '../create/settings-card';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournament, fetchTournamentStaff, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { ConfirmSheet } from '../roster/components/confirm-sheet';
import { editFormOf, isEditChanged, validateEdit, type EditForm } from './edit-form';
import { useSaveTournamentEdit } from './use-save-tournament-edit';

/** The owner's edit of a published tournament: images, playing days, overs and the registration window. */
export function EditTournamentScreen() {
  const { tournamentId = '' } = useLocalSearchParams<{ tournamentId: string }>();
  const { session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const userId = session?.user.id ?? '';
  const tournament = useQuery({ queryKey: tournamentKey(tournamentId), queryFn: () => fetchTournament(tournamentId) });
  const staff = useQuery({ queryKey: [...tournamentKey(tournamentId), 'staff'], queryFn: () => fetchTournamentStaff(tournamentId) });
  const record = tournament.data;
  const isOwner = staff.data?.some((member) => member.user.id === userId && member.role === 'owner') ?? false;
  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/tournament/[id]', params: { id: tournamentId } }));
  if (tournament.isPending || staff.isPending) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.link} accessibilityLabel="Loading tournament" /></View>;
  }
  const blocked = tournament.isError ? tournamentErrorText(tournament.error)
    : !record ? 'This tournament could not be found.'
    : record.closedAt ? 'This tournament is closed, so it can no longer be changed.'
    : !isOwner ? 'Only the tournament owner can edit it.' : null;
  if (blocked || !record) {
    return <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
      <Text variant="heading">Can't edit this tournament</Text><Text muted>{blocked}</Text>
      <Button label="Go back" variant="secondary" onPress={leave} />
    </View>;
  }
  return <EditTournamentForm key={record.id} record={record} userId={userId} onDone={leave} />;
}

function EditTournamentForm({ record, userId, onDone }: { record: TournamentRecord; userId: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [original] = useState(() => editFormOf(record));
  const [form, setForm] = useState(original);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [photoError, setPhotoError] = useState('');
  const [picking, setPicking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const save = useSaveTournamentEdit(record, userId);
  const changed = isEditChanged(form, original);

  function change<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    save.reset();
  }
  function close() {
    if (save.isPending || picking) return;
    if (changed) setLeaving(true);
    else onDone();
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => subscription.remove();
  });
  function submit() {
    if (save.isPending || picking) return;
    if (!changed) { onDone(); return; }
    const next = validateEdit(form, original, localDateKey(new Date()));
    setErrors(next);
    if (Object.values(next).some(Boolean)) { scroll.current?.scrollTo({ y: 0, animated: true }); return; }
    save.mutate(form, { onSuccess: onDone });
  }

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <AppIconTile icon={X} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Close without saving" onPress={close} />
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>Edit tournament</Text>
      <View style={{ width: sizes.iconButton }} />
    </View>
    <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
      <Text muted numberOfLines={2}>{record.name}</Text>
      <View>
        <View style={styles.artwork} pointerEvents={save.isPending ? 'none' : 'auto'}>
          <CoverPicker uri={form.coverUri} onChange={(uri) => change('coverUri', uri)} onBusyChange={setPicking} onError={setPhotoError} />
          <ProfilePhotoPicker uri={form.profileUri} onChange={(uri) => change('profileUri', uri)} onBusyChange={setPicking} onError={setPhotoError} />
        </View>
        {photoError ? <Text variant="caption" accessibilityRole="alert" style={styles.error}>{photoError}</Text> : null}
      </View>
      <SettingsCard>
        <DatePicker label="Start date" value={form.startDate} onChange={(value) => change('startDate', value)} error={errors.startDate} />
        <CardDivider />
        <DatePicker label="End date" value={form.endDate} minimumDate={form.startDate} onChange={(value) => change('endDate', value)} error={errors.endDate} />
      </SettingsCard>
      <SettingsCard>
        <NumberChoiceField label="Overs per side" icon={Volleyball} unit="overs" value={form.overs} min={OVERS.min} max={OVERS.max}
          presets={oversPresets} describe={oversFormatName} onChange={(value) => change('overs', value)} />
        <Text variant="caption" muted style={styles.hint}>Applies to matches that have not started. Matches already played keep their overs.</Text>
      </SettingsCard>
      <SettingsCard>
        <DatePicker label="Registration opens" value={form.registrationOpens} onChange={(value) => change('registrationOpens', value)} error={errors.registrationOpens} />
        <CardDivider />
        <DatePicker label="Registration deadline" value={form.registrationDeadline} minimumDate={form.registrationOpens}
          onChange={(value) => change('registrationDeadline', value)} error={errors.registrationDeadline} />
        <Text variant="caption" muted style={styles.hint}>Team owners add players inside this window. It must close by the start date.</Text>
      </SettingsCard>
      {Object.values(errors).some(Boolean) ? <Text accessibilityRole="alert" style={styles.error}>Check the highlighted fields to save your changes.</Text> : null}
      {save.isError ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(save.error)} Your changes are still here.</Text> : null}
      <Button label="Save changes" loading={save.isPending} disabled={picking} onPress={submit} />
    </ScrollView>
    <ConfirmSheet visible={leaving} title="Discard changes?" message="Your edits to this tournament have not been saved."
      confirmLabel="Discard changes" busy={false} error={null} onConfirm={() => { setLeaving(false); onDone(); }} onClose={() => setLeaving(false)} />
  </View>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  title: { flex: 1, ...typography.headlineLg, textAlign: 'center' },
  content: { paddingHorizontal: sizes.gutter, gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
  artwork: { paddingBottom: dp(28) },
  hint: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  error: { color: colors.dangerSoftText },
});
