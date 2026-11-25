import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppTabs, Button, Text } from '@/components/ui';
import { useOpenMatch } from '@/features/match';
import { spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { HistoryMatchCard } from '../components/history-match-card';
import { HistoryRecordTiles } from '../components/history-record-tiles';
import { teamErrorText } from '../data/team-errors';
import { fetchTeamHistory, teamHistoryKey, toHistory } from '../data/team-history';
import type { TeamRecord } from '../data/team-repository';
import type { HistoryResult } from '../types';

type Filter = 'all' | 'live' | 'won' | 'lost';
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'live', label: 'Live' }, { id: 'won', label: 'Won' }, { id: 'lost', label: 'Lost' },
];
const wanted: Record<Filter, HistoryResult | null> = { all: null, live: 'live', won: 'W', lost: 'L' };

/** A real team's tournament matches: its record, a result filter, and every match with both scores and the result. */
export function RealTeamMatches({ team }: { team: TeamRecord }) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const openMatch = useOpenMatch();
  const [filter, setFilter] = useState<Filter>('all');
  const history = useQuery({ queryKey: teamHistoryKey(team.id), queryFn: () => fetchTeamHistory(team.id) });

  if (history.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading matches" />;
  if (history.isError) {
    return (
      <View style={s.gap} accessibilityLiveRegion="polite">
        <Text muted>{teamErrorText(history.error)}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void history.refetch()} />
      </View>
    );
  }
  const { matches, record } = toHistory(team.id, team.name, history.data);
  if (matches.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>No matches yet</Text>
        <Text muted style={s.center}>A finished tournament or friendly shows here once the team owner accepts its sync request.</Text>
      </View>
    );
  }
  const shown = matches.filter((m) => wanted[filter] === null || m.result === wanted[filter]);
  return (
    <>
      <HistoryRecordTiles record={record} />
      <AppTabs tabs={filters} selected={filter} onSelect={setFilter} />
      <View style={s.gap}>
        {shown.length === 0 ? <Text muted>{`No ${filters.find((f) => f.id === filter)?.label.toLowerCase()} matches.`}</Text> : shown.map((match) => (
          <HistoryMatchCard key={match.id} match={match} onPress={() => openMatch(match.id, match.result === 'live' ? 'live' : 'result')} />
        ))}
      </View>
    </>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { ...typography.labelMd, color: c.text },
  center: { textAlign: 'center' },
});
