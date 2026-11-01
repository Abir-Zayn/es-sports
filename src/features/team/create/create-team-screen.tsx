import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, Button, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { localEventId } from '@/features/scoring/local-id';
import { radius, sizes, spacing, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import { teamErrorText } from '../data/team-errors';
import { createTeam, myTeamsKey } from '../data/team-repository';
import { cleanShortName, suggestShortName, teamProblem, type NewTeamInput } from '../data/team-rules';

const toneTabs: { id: AvatarTone; label: string }[] = [
  { id: 'blue', label: 'Blue' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'neutral', label: 'Grey' },
];

/** Names a new team. The signed-in person becomes its owner and invites the rest through invitations. */
export function CreateTeamScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  // One id per visit: a retry after a lost reply returns the team the first call made.
  const teamId = useRef(localEventId()).current;
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [shortEdited, setShortEdited] = useState(false);
  const [tone, setTone] = useState<AvatarTone>('blue');
  const [area, setArea] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const input: NewTeamInput = { name, shortName, tone, area };
  const mutation = useMutation({
    mutationFn: () => createTeam(teamId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: myTeamsKey(userId) });
      router.replace({ pathname: '/team/[id]', params: { id: teamId } });
    },
  });
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  function submit() {
    const found = teamProblem(input);
    setProblem(found);
    if (!found && userId) mutation.mutate();
  }
  function changeName(value: string) {
    setName(value);
    if (!shortEdited) setShortName(suggestShortName(value));
    setProblem(null);
  }
  function changeShortName(value: string) {
    setShortEdited(true);
    setShortName(cleanShortName(value));
    setProblem(null);
  }
  const shown = problem ?? (mutation.isError ? teamErrorText(mutation.error) : null);
  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back" onPress={goBack} />
        <Text accessibilityRole="header" style={styles.title}>Create team</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
        <TextField label="Team name" value={name} onChangeText={changeName} placeholder="e.g. Chattogram Strikers" maxLength={40} autoCapitalize="words" />
        <TextField label="Short name" value={shortName} onChangeText={changeShortName} placeholder="e.g. CS" maxLength={4} autoCapitalize="characters" />
        <View style={styles.group}>
          <Text variant="caption" muted>Team colour</Text>
          <AppTabs tabs={toneTabs} selected={tone} onSelect={setTone} />
        </View>
        <TextField label="Area (optional)" value={area} onChangeText={setArea} placeholder="e.g. Halishahar" maxLength={60} />
        {shown ? <Text accessibilityRole="alert" style={styles.error}>{shown}</Text> : null}
        <Button label="Create team" loading={mutation.isPending} disabled={!userId} onPress={submit} />
        <Text variant="caption" muted>You become the owner. People join your team by invitation.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  content: { paddingHorizontal: sizes.gutter, gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
  group: { gap: spacing.sm },
  error: { color: colors.dangerSoftText },
});
