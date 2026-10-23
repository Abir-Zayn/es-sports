import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppTabs } from '@/components/ui';
import { useOpenMatch } from '@/features/match/use-match-routes';
import { spacing } from '@/theme';

import { HistoryMatchCard } from './components/history-match-card';
import { HistoryRecordTiles } from './components/history-record-tiles';
import { TeamScreenFrame } from './components/team-screen-frame';
import { getTeamProfile } from './sample-team';
import type { HistoryResult } from './types';

type ResultFilter = 'all' | 'live' | 'won' | 'lost';

const filters: { id: ResultFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

const resultOf: Record<ResultFilter, HistoryResult | null> = { all: null, live: 'live', won: 'W', lost: 'L' };

/** The team's match history: record, a result filter, and every match with its outcome. */
export function TeamMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = id ?? 'CS';
  const { record, matches } = getTeamProfile(teamId);
  const openMatch = useOpenMatch();
  const [filter, setFilter] = useState<ResultFilter>('all');

  const wanted = resultOf[filter];
  const shown = matches.filter((m) => wanted === null || m.result === wanted);

  return (
    <TeamScreenFrame teamId={teamId} tab="matches">
      <HistoryRecordTiles record={record} />
      <AppTabs tabs={filters} selected={filter} onSelect={setFilter} />
      <View style={styles.list}>
        {shown.map((match) => (
          <HistoryMatchCard
            key={match.id}
            match={match}
            onPress={() => openMatch(match.id, match.result === 'live' ? 'live' : 'result')}
          />
        ))}
      </View>
    </TeamScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
