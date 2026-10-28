import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import Check from 'lucide-react-native/icons/check';
import X from 'lucide-react-native/icons/x';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { emptyDraft, validateDraft, type DraftErrors, type TournamentDraft } from './draft';
import { draftQueryKey, loadDraft, saveDraft } from './draft-storage';
import { TournamentFields } from './tournament-fields';

export function CreateTournamentScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const userId = session?.user.id ?? '';
  const query = useQuery({ queryKey: draftQueryKey(userId), queryFn: () => loadDraft(userId), enabled: Boolean(userId) });
  if (query.isPending) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.link} accessibilityLabel="Loading tournament draft" /></View>;
  if (query.isError && query.data === undefined) return <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
    <Text variant="heading">Could not open your draft</Text><Text muted>Your saved setup has not been changed. Try loading it again.</Text>
    <Button label="Try again" onPress={() => { void query.refetch(); }} />
    <Button label="Go back" variant="secondary" onPress={() => router.canGoBack() ? router.back() : router.replace('/tournaments')} />
  </View>;
  return <TournamentForm key={userId} userId={userId} initial={query.data ?? emptyDraft} />;
}

function TournamentForm({ userId, initial }: { userId: string; initial: TournamentDraft }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [leaving, setLeaving] = useState(false);
  const [pickingCover, setPickingCover] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const saving = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const mutation = useMutation({ mutationFn: (value: TournamentDraft) => saveDraft(userId, value) });
  const dirty = (Object.keys(initial) as (keyof TournamentDraft)[]).some((key) => initial[key] !== draft[key]);
  const busy = mutation.isPending || pickingCover;
  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/tournaments');
  }
  function goBack() {
    if (saving.current || pickingCover) return;
    if (dirty) setLeaving(true);
    else leave();
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { goBack(); return true; });
    return () => subscription.remove();
  });
  function change<K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    mutation.reset();
  }
  async function save(validate = true) {
    if (saving.current || pickingCover) return;
    Keyboard.dismiss();
    if (validate) {
      const nextErrors = validateDraft(draft);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) { scroll.current?.scrollTo({ y: 0, animated: false }); return; }
    }
    saving.current = true;
    try {
      const stored = await mutation.mutateAsync(draft);
      if (!mounted.current) return;
      queryClient.setQueryData(draftQueryKey(userId), stored);
      router.replace({ pathname: '/tournaments', params: { saved: '1' } });
    } catch { /* Mutation errors render below while entered values remain intact. */ }
    finally { saving.current = false; }
  }
  return <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <Stack.Screen options={{ gestureEnabled: false }} />
    <View style={styles.header}>
      <AppIconTile icon={X} size={48} borderRadius={24} accessibilityLabel="Close tournament setup" onPress={goBack} />
      <Text style={styles.headerTitle} accessibilityRole="header">Tournament</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Save tournament draft" accessibilityState={{ disabled: busy, busy: mutation.isPending }}
        disabled={busy} onPress={() => { void save(); }} style={({ pressed }) => [styles.save, (pressed || busy) && styles.pressed]}>
        {mutation.isPending ? <ActivityIndicator color={colors.primaryText} /> : <Check size={23} color={colors.primaryText} strokeWidth={2.2} />}
      </Pressable>
    </View>
    <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      <View pointerEvents={mutation.isPending ? 'none' : 'auto'}>
        <TournamentFields draft={draft} errors={errors} onChange={change} onBusyChange={setPickingCover}
          onAddTeams={() => router.push({ pathname: '/tournament/add-teams', params: { teams: String(draft.teams), name: draft.name } })} />
      </View>
      {Object.values(errors).some(Boolean) ? <Text accessibilityRole="alert" style={styles.error}>Check the highlighted fields to save your tournament.</Text> : null}
      {mutation.isError ? <Text accessibilityRole="alert" style={styles.error}>Could not save your draft. Your entries are still here. Please try again.</Text> : null}
    </ScrollView>
    <Modal visible={leaving} transparent animationType="none" onRequestClose={() => setLeaving(false)}>
      <View style={styles.modal}>
        <View style={styles.exit} accessibilityViewIsModal>
          <Text variant="heading">Keep your tournament?</Text><Text muted>Save your draft to pick up where you left off.</Text>
          {mutation.isError ? <Text accessibilityRole="alert" style={styles.error}>Could not save. Please try again.</Text> : null}
          <Button label="Save draft and leave" loading={mutation.isPending} onPress={() => { void save(false); }} />
          <Button label="Keep editing" variant="secondary" disabled={mutation.isPending} onPress={() => setLeaving(false)} />
          <Button label="Leave without saving" variant="ghost" disabled={mutation.isPending} onPress={leave} />
        </View>
      </View>
    </Modal>
  </KeyboardAvoidingView>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: sizes.gutter, paddingTop: spacing.sm,
    paddingBottom: spacing.xl, width: '100%', maxWidth: 600, alignSelf: 'center' },
  headerTitle: { flex: 1, fontWeight: '700', fontSize: 18, lineHeight: 24, textAlign: 'center' },
  save: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
  error: { color: colors.dangerSoftText }, modal: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  exit: { padding: spacing.lg, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, gap: spacing.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
