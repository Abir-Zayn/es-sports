import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { competitionFormats, type TournamentDraft } from '../create/draft';
import { ConfirmSheet } from '../roster/components/confirm-sheet';
import { EditMatchSheet } from './components/edit-match-sheet';
import { ScheduleDay } from './components/schedule-day';
import { ScheduleSettings } from './components/schedule-settings';
import type { ScheduledMatch, ScheduleTeam } from './types';
import { useScheduleBuilder } from './use-schedule-builder';

type Props = {
  tournamentId: string;
  setup: TournamentDraft;
  days: string[];
  teams: ScheduleTeam[];
  isOwner: boolean;
  bottomInset: number;
};

const shortDate = (date: string) => format(parseISO(date), 'd MMM');

/**
 * Settings, then the matches day by day, then Publish. The owner draws, moves and publishes; anyone else on
 * the staff sees the schedule read-only.
 */
export function ScheduleBuilder({ tournamentId, setup, days, teams, isOwner, bottomInset }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const builder = useScheduleBuilder({ tournamentId, teams, competition: setup.competition, matchFormat: setup.matchFormat, days, isOwner });
  const [editing, setEditing] = useState<ScheduledMatch | null>(null);
  const [confirmRedraw, setConfirmRedraw] = useState(false);
  const { matches, saved, publish } = builder;
  const playingDays = [...new Set(matches.map((m) => m.date))];
  const formatLabel = competitionFormats.find((f) => f.value === setup.competition)?.label ?? '';

  if (saved.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading schedule" style={styles.status} />;

  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xxl }]}>
        <Text muted>
          {formatLabel} · {setup.matchFormat} · {teams.length} teams · {shortDate(setup.startDate)} – {shortDate(setup.endDate)}
        </Text>
        {isOwner ? (
          <>
            <ScheduleSettings settings={builder.settings} onChange={builder.changeSettings} />
            <Button
              label={matches.length > 0 ? 'Redraw schedule' : 'Draw schedule'}
              variant={matches.length > 0 ? 'secondary' : 'primary'}
              onPress={() => (matches.length > 0 ? setConfirmRedraw(true) : builder.draw())}
            />
          </>
        ) : (
          <Text variant="caption" muted>
            Only the tournament owner can change the schedule.
          </Text>
        )}
        {builder.problem ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {builder.problem}
          </Text>
        ) : null}
        {builder.outOfDate ? (
          <Text accessibilityRole="alert" style={styles.warning}>
            The teams have changed since this schedule was drawn. Draw it again before publishing.
          </Text>
        ) : null}
        {matches.length === 0 ? (
          <Text muted style={styles.empty}>
            {teams.length < 2 ? 'Add at least 2 teams, then draw the schedule.' : 'No schedule yet. Pick the settings and draw it.'}
          </Text>
        ) : (
          <>
            <Text variant="caption" muted>
              {matches.length} matches over {playingDays.length} days.{isOwner ? ' Tap a match to move it.' : ''}
            </Text>
            {playingDays.map((date) => (
              <ScheduleDay
                key={date}
                date={date}
                venue={setup.venue}
                matches={matches.filter((m) => m.date === date)}
                onEdit={isOwner ? setEditing : undefined}
              />
            ))}
          </>
        )}
        {isOwner && matches.length > 0 ? (
          <View style={styles.publish}>
            <Text variant="caption" muted accessibilityLiveRegion="polite">
              {saved.data?.publishedAt && !builder.dirty ? 'Published. Teams and followers can see it.' : 'Not published yet. Only the staff can see it.'}
            </Text>
            {builder.publishError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {builder.publishError}
              </Text>
            ) : null}
            <Button
              label={saved.data?.publishedAt ? 'Publish changes' : 'Publish schedule'}
              loading={publish.isPending}
              disabled={builder.outOfDate || (!builder.dirty && Boolean(saved.data?.publishedAt))}
              onPress={() => publish.mutate()}
            />
          </View>
        ) : null}
      </ScrollView>
      <EditMatchSheet match={editing} days={days} onSave={(date, startMin) => (editing ? builder.move(editing.id, date, startMin) : null)} onClose={() => setEditing(null)} />
      <ConfirmSheet
        visible={confirmRedraw}
        title="Redraw schedule?"
        message="Every match is drawn again from the teams and settings. Matches you moved by hand go back to their drawn days."
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
