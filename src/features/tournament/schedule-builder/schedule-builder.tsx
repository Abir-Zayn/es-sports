import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { competitionFormats, oversLabel, type TournamentDraft } from '../create/draft';
import { isUuid } from '@/features/scoring/data/uuid';

import { StartMatchSheet } from '../fixture-match/start-match-sheet';
import { canStartFixture } from '../fixture-match/start-fixture';
import { ConfirmSheet } from '../roster/components/confirm-sheet';
import { AddMatchSheet } from './components/add-match-sheet';
import { EditMatchSheet } from './components/edit-match-sheet';
import { ScheduleControls } from './components/schedule-controls';
import { ScheduleDay } from './components/schedule-day';
import type { ScheduledMatch, ScheduleTeam } from './types';
import { useScheduleBuilder } from './use-schedule-builder';

/** What the builder needs from the tournament: a draft's setup or a published tournament's. */
export type ScheduleSetup = Pick<TournamentDraft, 'competition' | 'overs' | 'venue' | 'startDate' | 'endDate' | 'playersPerSide'>;

type Props = {
  tournamentId: string;
  setup: ScheduleSetup;
  days: string[];
  teams: ScheduleTeam[];
  isOwner: boolean;
  isStaff?: boolean;
  bottomInset: number;
};

const shortDate = (date: string) => format(parseISO(date), 'd MMM');

/**
 * The owner picks auto draw or manual, builds the matches, then publishes. Once published, tapping a match moves or
 * cancels it at once (the owner panel). Anyone else on the staff sees the schedule read-only.
 */
export function ScheduleBuilder({ tournamentId, setup, days, teams, isOwner, isStaff = false, bottomInset }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const builder = useScheduleBuilder({ tournamentId, teams, competition: setup.competition, overs: setup.overs, days, isOwner });
  const [starting, setStarting] = useState<ScheduledMatch | null>(null);
  const [editing, setEditing] = useState<ScheduledMatch | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmRedraw, setConfirmRedraw] = useState(false);
  const { matches, saved, publish, live } = builder;
  const playingDays = [...new Set(matches.map((m) => m.date))];
  const formatLabel = competitionFormats.find((f) => f.value === setup.competition)?.label ?? '';
  const locked = live && matches.some((m) => m.started);
  const published = Boolean(saved.data?.publishedAt);

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
        <Text muted>
          {formatLabel} · {oversLabel(setup.overs)} · {teams.length} teams · {shortDate(setup.startDate)} – {shortDate(setup.endDate)}
        </Text>
        {isOwner ? (
          <ScheduleControls mode={builder.mode} settings={builder.settings} hasMatches={matches.length > 0} locked={locked}
            onMode={builder.changeMode} onSettings={builder.changeSettings} onAdd={() => setAdding(true)}
            onDraw={() => (matches.length > 0 ? setConfirmRedraw(true) : builder.draw())} />
        ) : (
          <Text variant="caption" muted>Only the tournament owner can change the schedule.</Text>
        )}
        {builder.problem ? <Text accessibilityRole="alert" style={styles.error}>{builder.problem}</Text> : null}
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
            <Text variant="caption" muted>
              {matches.length} matches over {playingDays.length} days.{isOwner ? ' Tap a match to change it.' : ''}
            </Text>
            {playingDays.map((date) => (
              <ScheduleDay key={date} date={date} venue={setup.venue} matches={matches.filter((m) => m.date === date)} onEdit={isOwner || (isStaff && live && isUuid(tournamentId)) ? setEditing : undefined} />
            ))}
          </>
        )}
        {isOwner && (matches.length > 0 || builder.dirty) ? (
          <View style={styles.publish}>
            <Text variant="caption" muted accessibilityLiveRegion="polite">
              {live ? 'Published. Moving or cancelling a match saves at once and tells both teams.' : 'Not published yet. Only the staff can see these changes.'}
            </Text>
            {builder.publishError ? <Text accessibilityRole="alert" style={styles.error}>{builder.publishError}</Text> : null}
            {live ? null : (
              <Button label={published ? 'Publish changes' : 'Publish schedule'} loading={publish.isPending}
                disabled={builder.outOfDate || matches.length === 0} onPress={() => publish.mutate()} />
            )}
            {published && builder.dirty ? <Button label="Discard changes" variant="secondary" disabled={publish.isPending} onPress={builder.discard} /> : null}
          </View>
        ) : null}
      </ScrollView>
      <EditMatchSheet
        match={editing}
        readOnly={!isOwner}
        days={days}
        onSave={(date, startMin) => (editing ? builder.move(editing.id, date, startMin) : Promise.resolve(null))}
        onRemove={!live && builder.mode === 'manual' && editing ? () => builder.remove(editing.id) : undefined}
        onStart={live && editing && isUuid(tournamentId) && canStartFixture(editing, isStaff || isOwner) ? () => { setStarting(editing); setEditing(null); } : undefined}
        onCancelMatch={live && editing && isOwner ? (reason) => builder.cancelMatch(editing.id, reason) : undefined}
        onClose={() => setEditing(null)}
      />
      {starting ? <StartMatchSheet key={starting.id} tournamentId={tournamentId} match={starting} playersPerSide={setup.playersPerSide} onClose={() => setStarting(null)} /> : null}
      <AddMatchSheet visible={adding} teams={teams} days={days} firstStartMin={builder.settings.firstStartMin} onAdd={builder.add} onClose={() => setAdding(false)} />
      <ConfirmSheet
        visible={confirmRedraw}
        title="Redraw schedule?"
        message="Every match is drawn again from the teams and settings. Matches you moved or added by hand are replaced."
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
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    error: { color: colors.dangerSoftText },
    warning: { color: colors.accent },
    empty: { paddingVertical: spacing.md },
    publish: { gap: spacing.sm, paddingTop: spacing.md },
  });
