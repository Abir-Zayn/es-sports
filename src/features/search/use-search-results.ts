import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { searchPlayers } from '@/features/match';
import { fetchTeamDirectory } from '@/features/team/data/team-lifecycle';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';

import { searchTournaments } from './search-repository';
import type { SearchGroup, SearchGroupId, SearchRow, SearchTab } from './types';

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 2;

/**
 * Teams, players and tournaments from the server for the Search screen. Players are also found by a pasted user id.
 * Typing is debounced and stale searches are cancelled.
 */
export function useSearchResults(query: string, tab: SearchTab) {
  const { t } = useTranslation();
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettled(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const on = (group: SearchGroupId) => (tab === 'all' || tab === group) && settled.length >= MIN_LENGTH;
  const players = useQuery({
    queryKey: ['global-search-players', settled], enabled: on('players'),
    queryFn: ({ signal }) => searchPlayers(settled, [], signal),
  });
  const teams = useQuery({ queryKey: ['global-search-teams', settled], enabled: on('teams'), queryFn: () => fetchTeamDirectory(settled) });
  const tournaments = useQuery({
    queryKey: ['global-search-tournaments', settled], enabled: on('tournaments'),
    queryFn: ({ signal }) => searchTournaments(settled, signal),
  });

  const playerBadge = t('search.playerBadge');
  const teamBadge = t('search.teamBadge');
  const tournamentBadge = t('search.tournamentBadge');
  const rows: Record<SearchGroupId, SearchRow[]> = {
    teams: on('teams') ? (teams.data ?? []).map((team) => ({
      id: team.id, short: team.shortName, name: team.name, meta: team.area ?? t('search.teamPlayers', { count: team.members }),
      badge: teamBadge, tone: team.tone, shape: 'circle', imageUri: team.logoUrl,
    })) : [],
    players: on('players') ? (players.data ?? []).map((player) => ({
      id: player.id, short: initialsOf(player.name), name: player.name, meta: player.area ?? playerBadge, badge: playerBadge,
      tone: 'neutral', shape: 'circle', imageUri: player.avatarUrl,
    })) : [],
    tournaments: on('tournaments') ? (tournaments.data ?? []).map((tournament) => ({
      id: tournament.id, short: initialsOf(tournament.name), name: tournament.name, meta: tournament.city ?? tournamentBadge,
      badge: tournamentBadge, tone: 'blue', shape: 'square', imageUri: tournament.profile_url,
    })) : [],
  };
  const order: SearchGroupId[] = ['teams', 'players', 'tournaments'];
  const groups: SearchGroup[] = order.filter((id) => rows[id].length > 0).map((id) => ({ id, rows: rows[id] }));
  const queries = [players, teams, tournaments];
  // Waiting also covers the debounce gap, so "No results" never flashes while the person is still typing.
  const waiting = query.trim().length >= MIN_LENGTH && (settled !== query.trim() || queries.some((q) => q.isFetching));
  return { groups, waiting, failed: queries.some((q) => q.isError) };
}
