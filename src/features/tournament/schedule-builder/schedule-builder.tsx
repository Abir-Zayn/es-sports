import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { dp, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { oversLabel, type TournamentDraft } from '../create/draft';
import { isUuid } from '@/features/scoring/data/uuid';
import { ResumeScoringAction } from '@/features/scoring/handover/components/resume-scoring-action';

import { StartMatchSheet } from '../fixture-match/start-match-sheet';
import { canStartFixture } from '../fixture-match/start-fixture';
import type { RoundView } from '../data/rounds-repository';
import type { EnteredTeam, TournamentRecord } from '../data/tournament-repository';
import { ConfirmSheet } from '../roster/components/confirm-sheet';
import { GroupsSection } from '../teams/groups-section';
import { AddMatchSheet } from './components/add-match-sheet';
import { EditMatchSheet } from './components/edit-match-sheet';
import { RoundPlanCard } from './components/round-plan-card';
import { ScheduleControls } from './components/schedule-controls';
import { ScheduleDay } from './components/schedule-day';
import { ScheduleSummary, type ScheduleStatus } from './components/schedule-summary';
import { knockoutStage } from './generate';
import type { RoundPlan, ScheduledMatch, ScheduleTeam } from './types';
import { useScheduleBuilder } from './use-schedule-builder';

/** What the builder needs from the tournament: a draft's setup or a published tournament's. */
export type ScheduleSetup = Pick<TournamentDraft, 'competition' | 'overs' | 'venue' | 'startDate' | 'endDate' | 'playersPerSide'> & {
  /** The round to draw in a published tournament with rounds. */
  plan?: RoundPlan;
};

type Props = {
  tournamentId: string;
  setup: ScheduleSetup;
  days: string[];
  teams: ScheduleTeam[];
  isOwner: boolean;
  isStaff?: boolean;
  bottomInset: number;
  groups?: { tournament: TournamentRecord; teams: EnteredTeam[]; round: RoundView };
};

const shortDate = (date: string) => format(parseISO(date), 'd MMM');

/**
 * The owner picks auto draw or manual, builds the matches, then publishes. Once published, tapping a match moves or
 * cancels it at once (the owner panel). Anyone else on the staff sees the schedule read-only.
 */
export function ScheduleBuilder({ tournamentId, setup, days, teams, isOwner, isStaff = false, bottomInset, groups }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const builder = useScheduleBuilder({ tournamentId, teams, competition: setup.competition, overs: setup.overs, days, isOwner, plan: setup.plan });
  const [starting, setStarting] = useState<ScheduledMatch | null>(null);
  const [editing, setEditing] = useState<ScheduledMatch | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmRedraw, setConfirmRedraw] = useState(false);
  const { matches, saved, publish, live } = builder;
  const router = useRouter();
  const plan = setup.plan;
  // A later round with no matches yet gets its own draw that keeps earlier rounds; Add match offers only its teams.
  const planMatches = plan ? matches.filter((m) => (plan.kind === 'knockout' ? m.stage !== 'League' : m.stage === 'League' && m.round === plan.round)) : matches;
  const freshRound = Boolean(plan && plan.round > 0 && planMatches.length === 0 && (plan.kind === 'knockout' || plan.groupIds));
  const addTeams = plan?.kind === 'knockout' && plan.round > 0 ? teams.filter((t) => plan.slots.includes(t.id)) : teams;
  const outOfDays = Boolean(builder.problem?.startsWith('No days are left'));
  const playingDays = [...new Set(matches.map((m) => m.date))];
  const locked = live && matches.some((m) => m.started && (!setup.plan || (setup.plan.kind === 'groups' ? m.stage === 'League' && m.round === setup.plan.round : m.stage !== 'League')));
  const published = Boolean(saved.data?.publishedAt);
  const status: ScheduleStatus = locked ? 'underway' : live ? 'published' : published && builder.dirty ? 'changes' : 'draft';

  if (saved.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading schedule" style={styles.status} />;
  if (saved.isError) {
    return (
      <View style={styles.content}>
        <Text muted>Could not load the schedule.</Text>
        <Button label="Try again" variant="secondary" onPress={() => void saved.refetch()} />
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xxl }]}>
        <ScheduleSummary status={status} viewOnly={!isOwner} format={oversLabel(setup.overs)} teams={teams.length}
          dates={`${shortDate(setup.startDate)} – ${shortDate(setup.endDate)}`} matches={matches.length} days={playingDays.length} />
        {groups && groups.round.kind === 'groups' && groups.round.groups > 1 ? (
          <GroupsSection tournament={groups.tournament} teams={groups.teams} round={groups.round}
            canChange={isOwner && !matches.some((match) => match.stage === 'League' && match.round === groups.round.round && match.started)} />
        ) : null}
        {!groups && setup.plan?.kind === 'groups' && setup.plan.groupIds === null ? <Text muted>Draw the groups before scheduling group matches.</Text> : null}
        {!groups && setup.plan?.kind === 'groups' ? setup.plan.groupIds?.map((ids, index) => (
          <Card key={`group-${index}`}>
            <Text>{`Group ${String.fromCharCode(65 + index)}`}</Text>
            <Text muted>{ids.map((id) => teams.find((team) => team.id === id)?.name ?? 'Team').join(' · ')}</Text>
          </Card>
        )) : null}
        {isOwner && freshRound && plan ? <RoundPlanCard plan={plan} teams={teams} onDraw={builder.draw} /> : null}
        {isOwner ? (
          <ScheduleControls mode={builder.mode} settings={builder.settings} hasMatches={planMatches.length > 0} locked={locked}
            onMode={builder.changeMode} onSettings={builder.changeSettings} onAdd={() => setAdding(true)}
            onDraw={() => (planMatches.length > 0 ? setConfirmRedraw(true) : builder.draw())} />
        ) : null}
        {builder.problem ? <Text accessibilityRole="alert" style={styles.error}>{builder.problem}</Text> : null}
        {builder.problem && outOfDays && isOwner && isUuid(tournamentId) ? (
          <Button label="Change tournament dates" variant="secondary" onPress={() => router.push({ pathname: '/tournament/edit', params: { tournamentId } })} />
        ) : null}
        {builder.outOfDate ? (
          <Text accessibilityRole="alert" style={styles.warning}>
            The teams have changed since this schedule was made. Draw it again or fix the matches before publishing.
          </Text>
        ) : null}
        {matches.length === 0 ? (
          <Text muted style={styles.empty}>
            {teams.length < 2 ? 'Add at least 2 teams first.' : builder.mode === 'manual' ? 'No matches yet. Add the first one.' : 'No schedule yet. Pick the settings and draw it.'}
          </Text>
        ) : (
          <>
            {isOwner ? <Text variant="caption" muted>Tap a match to change it.</Text> : null}
            {playingDays.map((date) => (
              <ScheduleDay key={date} date={date} venue={setup.venue} matches={matches.filter((m) => m.date === date)} onEdit={isOwner || (isStaff && live && isUuid(tournamentId)) ? setEditing : undefined} />
            ))}
          </>
        )}
        {isOwner && (matches.length > 0 || builder.dirty) ? (
          <Card style={styles.publish}>
            <Text variant="caption" muted accessibilityLiveRegion="polite">
              {live ? 'Published. Moving or cancelling a match saves at once and tells both teams.' : 'Not published yet. Only the staff can see these changes.'}
            </Text>
            {builder.publishError ? <Text accessibilityRole="alert" style={styles.error}>{builder.publishError}</Text> : null}
            {live ? null : (
              <Button label={published ? 'Publish changes' : 'Publish schedule'} loading={publish.isPending}
                disabled={builder.outOfDate || matches.length === 0} onPress={() => publish.mutate()} />
            )}
            {published && builder.dirty ? <Button label="Discard changes" variant="secondary" disabled={publish.isPending} onPress={builder.discard} /> : null}
          </Card>
        ) : null}
      </ScrollView>
      <EditMatchSheet
        match={editing}
        readOnly={!isOwner}
        days={days}
        onSave={(date, startMin) => (editing ? builder.move(editing.id, date, startMin) : Promise.resolve(null))}
        onRemove={!live && builder.mode === 'manual' && editing ? () => builder.remove(editing.id) : undefined}
        onStart={live && editing && isUuid(tournamentId) && canStartFixture(editing, isStaff || isOwner) ? () => { setStarting(editing); setEditing(null); } : undefined}
        onCancelMatch={live && editing && isOwner && !editing.started ? (reason) => builder.cancelMatch(editing.id, reason) : undefined}
        continueScoring={editing?.match && !editing.finished ? <ResumeScoringAction matchId={editing.match.id} onOpen={() => setEditing(null)} /> : undefined}
        onClose={() => setEditing(null)}
      />
      {starting ? <StartMatchSheet key={starting.id} tournamentId={tournamentId} match={starting} playersPerSide={setup.playersPerSide} onClose={() => setStarting(null)} /> : null}
      <AddMatchSheet visible={adding} teams={addTeams} groupIds={plan?.kind === 'groups' ? plan.groupIds : undefined}
        defaultStage={plan?.kind === 'knockout' && plan.round > 0 ? knockoutStage(plan.slots.length) : undefined} days={days} firstStartMin={builder.settings.firstStartMin} onAdd={builder.add} onClose={() => setAdding(false)} />
      <ConfirmSheet
        visible={confirmRedraw}
        title="Redraw schedule?"
        message={plan && plan.round > 0 ? "This round's matches are drawn again. Earlier rounds stay as they are." : 'Every match is drawn again from the teams and settings. Matches you moved or added by hand are replaced.'}
        confirmLabel="Redraw"
        busy={false}
        error={null}
        onConfirm={() => {
          builder.draw();
          setConfirmRedraw(false);
        }}
        onClose={() => setConfirmRedraw(false)}
      />
    </>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: sizes.sectionGap, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    error: { color: colors.dangerSoftText },
    warning: { color: colors.accent },
    empty: { paddingVertical: spacing.md },
    publish: { gap: spacing.md },
  });
