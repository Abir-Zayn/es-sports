import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { isUuid } from '@/features/scoring/data/uuid';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { competitionFormats } from '../create/draft';
import { draftQueryKey, loadDraft } from '../create/draft-storage';
import { fetchTournament, tournamentKey } from '../data/tournament-repository';
import { capabilitiesOf, roleIn } from '../roster/permissions';
import { repoFor } from '../roster/roster-source';
import { useMe, useRoster } from '../roster/use-roster';
import { ScheduleBuilder, type ScheduleSetup } from './schedule-builder';
import { tournamentDays } from './slots';

/** A published tournament's setup, read from the server, or the draft's from the device. Null when there is none. */
function useSetup(tournamentId: string, meId: string): { setup: ScheduleSetup | null; name: string; pending: boolean; failed: boolean; retry: () => void } {
  const server = isUuid(tournamentId);
  const draft = useQuery({ queryKey: draftQueryKey(meId), queryFn: () => loadDraft(meId), enabled: Boolean(meId) && !server });
  const record = useQuery({ queryKey: tournamentKey(tournamentId), queryFn: () => fetchTournament(tournamentId), enabled: server });
  if (!server) {
    return { setup: draft.data ?? null, name: draft.data?.name ?? '', pending: draft.isPending, failed: draft.isError, retry: () => void draft.refetch() };
  }
  const t = record.data;
  const setup: ScheduleSetup | null = t ? {
    competition: competitionFormats.find((f) => f.value === t.competition)?.value ?? 'league',
    overs: t.overs,
    playersPerSide: t.playersPerSide, venue: t.venue, startDate: t.startDate, endDate: t.endDate,
  } : null;
  return { setup, name: t?.name ?? '', pending: record.isPending, failed: record.isError, retry: () => void record.refetch() };
}

/** Loads the setup and the teams (of a published tournament, or the draft being set up), then hands them to the builder. */
export function ScheduleBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const me = useMe();
  const params = useLocalSearchParams<{ tournamentId?: string }>();
  const tournamentId = params.tournamentId && isUuid(params.tournamentId) ? params.tournamentId : `draft:${me.id}`;
  const setup = useSetup(tournamentId, me.id);
  // Reached from the teams screen, which has already loaded the roster.
  const roster = useRoster(tournamentId, me, undefined, repoFor(tournamentId));
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tournament/create'));

  let body: ReactNode;
  if (setup.pending || roster.isPending) {
    body = <ActivityIndicator color={colors.link} accessibilityLabel="Loading schedule" style={styles.status} />;
  } else if (setup.failed || roster.isError || !roster.data) {
    body = (
      <View style={styles.message}>
        <Text muted>Could not load the tournament.</Text>
        <Button label="Try again" variant="secondary" onPress={() => { setup.retry(); void roster.refetch(); }} />
      </View>
    );
  } else if (!hasDates(setup.setup)) {
    body = (
      <View style={styles.message}>
        <Text muted>Save the tournament setup with its start and end dates first, so the schedule knows which days it has.</Text>
        <Button label="Back to setup" variant="secondary" onPress={goBack} />
      </View>
    );
  } else {
    body = (
      <ScheduleBuilder
        tournamentId={tournamentId}
        setup={setup.setup}
        days={tournamentDays(setup.setup.startDate, setup.setup.endDate)}
        teams={roster.data.teams.map(({ id, name, short }) => ({ id, name, short }))}
        isOwner={capabilitiesOf(roleIn(roster.data, me.id)).manageSchedule}
        isStaff={roleIn(roster.data, me.id) !== null}
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
          {setup.name ? (
            <Text muted numberOfLines={1} style={styles.subtitle}>
              {setup.name}
            </Text>
          ) : null}
        </View>
      </View>
      {body}
    </View>
  );
}

function hasDates(setup: ScheduleSetup | null): setup is ScheduleSetup {
  return Boolean(setup?.startDate && setup.endDate && tournamentDays(setup.startDate, setup.endDate).length > 0);
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
