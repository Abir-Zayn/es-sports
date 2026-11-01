import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { fetchMyTeams, myTeamsKey, type MyTeam } from '@/features/team/data/team-repository';
import type { TeamInfo } from '@/types/cricket';

import { mergeTeams, type Career } from './career-model';
import { careerKey, fetchCareer } from './career-repository';

export type CareerView = Career & {
  status: 'loading' | 'ready' | 'error';
  /** Teams the account belongs to (real teams), for the "Your Teams" row. */
  memberTeams: MyTeam[];
  /** Teams played for plus teams belonged to, each name once: the "Teams" figure. */
  allTeams: TeamInfo[];
  reload: () => void;
};

const emptyBatting = { matches: 0, innings: 0, runs: 0, highest: '-', average: '-', strikeRate: '-', fifties: 0, hundreds: 0 };
const emptyBowling = { matches: 0, overs: '0.0', wickets: 0, best: '-', economy: '-', average: '-', threeW: 0, fiveW: 0 };

/**
 * The signed-in player's real career: matches, runs, wickets and teams from finished matches on the server. It is
 * read again every time the profile comes into view and when the app returns to the foreground, so a match that
 * just finished shows up without a restart.
 */
export function useCareer(userId: string | undefined): CareerView {
  const career = useQuery({ queryKey: careerKey(userId ?? ''), enabled: Boolean(userId), staleTime: 0, queryFn: () => fetchCareer(userId ?? '') });
  const teams = useQuery({ queryKey: myTeamsKey(userId ?? ''), enabled: Boolean(userId), staleTime: 0, queryFn: () => fetchMyTeams(userId ?? '') });
  const { refetch: refetchCareer } = career;
  const { refetch: refetchTeams } = teams;
  const reload = useCallback(() => { void refetchCareer(); void refetchTeams(); }, [refetchCareer, refetchTeams]);
  useFocusEffect(useCallback(() => { if (userId) reload(); }, [userId, reload]));

  const memberTeams = useMemo(() => teams.data ?? [], [teams.data]);
  const played = career.data?.teams;
  const allTeams = useMemo(
    () => mergeTeams(played ?? [], memberTeams.map((team): TeamInfo => ({ short: team.shortName, name: team.name, tone: team.tone, avatarUri: team.logoUrl ?? undefined }))),
    [played, memberTeams],
  );
  // A figure already shown stays while it refreshes; an error shows only when there is nothing to show.
  const status = career.data ? 'ready' : career.isError ? 'error' : 'loading';
  return {
    batting: career.data?.batting ?? emptyBatting, bowling: career.data?.bowling ?? emptyBowling,
    recent: career.data?.recent ?? [], teams: played ?? [], status, memberTeams, allTeams, reload,
  };
}
