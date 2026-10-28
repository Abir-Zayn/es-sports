import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { TournamentDraft } from '../create/draft';
import { draftQueryKey, loadDraft } from '../create/draft-storage';
import { capabilitiesOf, roleIn } from '../roster/permissions';
import { useMe, useRoster } from '../roster/use-roster';
import { ScheduleBuilder } from './schedule-builder';
import { tournamentDays } from './slots';

/** Loads the saved setup and the teams, then hands them to the builder. */
export function ScheduleBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const me = useMe();
  const draft = useQuery({ queryKey: draftQueryKey(me.id), queryFn: () => loadDraft(me.id), enabled: Boolean(me.id) });
  const tournamentId = `draft:${me.id}`;
  const roster = useRoster(tournamentId, draft.data?.teams ?? 8, me);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tournament/create'));

  let body: ReactNode;
  if (draft.isPending || roster.isPending) {
    body = <ActivityIndicator color={colors.link} accessibilityLabel="Loading schedule" style={styles.status} />;
  } else if (draft.isError || roster.isError || !roster.data) {
    body = (
      <View style={styles.message}>
        <Text muted>Could not load the tournament.</Text>
        <Button label="Try again" variant="secondary" onPress={() => void Promise.all([draft.refetch(), roster.refetch()])} />
      </View>
    );
  } else if (!hasDates(draft.data)) {
    body = (
      <View style={styles.message}>
        <Text muted>Save the tournament setup with its start and end dates first, so the schedule knows which days it has.</Text>
        <Button label="Back to setup" variant="secondary" onPress={goBack} />
      </View>
    );
  } else {
    const setup = draft.data;
    body = (
      <ScheduleBuilder
        tournamentId={tournamentId}
        setup={setup}
        days={tournamentDays(setup.startDate, setup.endDate)}
        teams={roster.data.teams.map(({ id, name, short }) => ({ id, name, short }))}
        isOwner={capabilitiesOf(roleIn(roster.data, me.id)).manageSchedule}
        bottomInset={insets.bottom}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title}>
            Schedule
          </Text>
          {draft.data?.name ? (
            <Text muted numberOfLines={1} style={styles.subtitle}>
              {draft.data.name}
            </Text>
          ) : null}
        </View>
      </View>
      {body}
    </View>
  );
}

function hasDates(draft: TournamentDraft | null | undefined): draft is TournamentDraft {
  return Boolean(draft?.startDate && draft.endDate && tournamentDays(draft.startDate, draft.endDate).length > 0);
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    titles: { flex: 1, minWidth: 0 },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    subtitle: { fontSize: 13, lineHeight: 18 },
    status: { paddingVertical: spacing.xxl },
    message: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  });
