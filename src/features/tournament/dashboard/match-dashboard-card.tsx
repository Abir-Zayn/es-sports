import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, Text } from '@/components/ui';
import type { FixtureStreamer } from '@/features/broadcast/data/fixture-streamers';
import { radius, spacing, useThemedStyles, useTheme, type Palette } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import type { PersonRecord } from '../data/tournament-repository';
import { timeLabel } from '../schedule-builder/slots';
import type { ScheduledMatch, SideRef } from '../schedule-builder/types';
import { ChooseStreamerSheet } from './choose-streamer-sheet';
import { countdownLabel } from './next-match';
import { streamerAction, type Viewer } from './streamer-action';
import { useNow } from './use-now';
import { useStreamerActions } from './use-streamer-actions';

type Props = {
  tournamentId: string;
  match: ScheduledMatch;
  streamer: FixtureStreamer | undefined;
  moderators: PersonRecord[];
  viewer: Viewer;
  onGoLive: (fixtureId: string) => void;
};

const sideName = (side: SideRef) => (side.kind === 'team' ? side.team.name : side.label);

/** The dashboard's "next match": who plays, how long until it starts, who streams it, and the streaming button. */
export function MatchDashboardCard({ tournamentId, match, streamer, moderators, viewer, onGoLive }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const now = useNow();
  const [choosing, setChoosing] = useState(false);
  const actions = useStreamerActions(tournamentId, match.id);
  const started = Boolean(match.match);
  const action = streamerAction(viewer, streamer ?? null, started);
  const streamerName = moderators.find((person) => person.id === streamer?.streamerId)?.name ?? null;
  const live = match.match?.status === 'live';
  const onFacebook = streamer?.state === 'live';

  return (
    <View style={styles.card} accessibilityLabel={`Next match, ${sideName(match.home)} versus ${sideName(match.away)}`}>
      <View style={styles.badges}>
        <Text style={styles.kicker}>{live ? 'ON NOW' : 'NEXT MATCH'}</Text>
        {onFacebook ? <AppBadge label="LIVE ON FACEBOOK" dot backgroundColor={colors.danger} color="#FFFFFF" /> : null}
      </View>
      <Text style={styles.teams} numberOfLines={2}>{`${sideName(match.home)}  vs  ${sideName(match.away)}`}</Text>
      <Text style={styles.countdown}>{countdownLabel(match, now)}</Text>
      <Text muted>{`Match ${match.number} · ${format(parseISO(match.date), 'EEE, d MMM')} · ${timeLabel(match.startMin)}`}</Text>
      <Text muted>{streamerName ? `Streamer: ${streamerName}` : 'No streamer chosen yet'}</Text>

      {action === 'choose' ? <Button label={streamer ? 'Change streamer' : 'Choose streamer'} variant="secondary" onPress={() => setChoosing(true)} /> : null}
      {action === 'take' ? <Button label="I will stream this match" variant="secondary" loading={actions.busy} onPress={() => viewer.userId && actions.assign.mutate(viewer.userId)} /> : null}
      {action === 'wait-for-match' ? <Text muted>You are the streamer. Go live is available once the match has been started.</Text> : null}
      {action === 'go-live' ? <Button label="Go live on Facebook" onPress={() => onGoLive(match.id)} /> : null}
      {action === 'resume-live' ? <Button label="Back to the live stream" onPress={() => onGoLive(match.id)} /> : null}
      {actions.error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{tournamentErrorText(actions.error)}</Text> : null}
      {choosing ? <ChooseStreamerSheet tournamentId={tournamentId} fixtureId={match.id} moderators={moderators} currentId={streamer?.streamerId ?? null}
        onClose={() => setChoosing(false)} /> : null}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1.5, color: colors.textMuted },
  teams: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  countdown: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.link },
});
