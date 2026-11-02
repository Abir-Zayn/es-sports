import { format, parseISO } from 'date-fns';

import { formatOvers } from '@/features/matches/matches-repository';
import type { Fixture, TeamInfo } from '@/types/cricket';

import { timeLabel } from './slots';
import type { ScheduledMatch, SideRef } from './types';

const teamInfo = (side: SideRef): TeamInfo =>
  side.kind === 'team' ? { short: side.team.short, name: side.team.name, tone: 'neutral' } : { short: 'TBD', name: side.label, tone: 'neutral' };

/** A scheduled match as the shared match tile shows it: number and stage, date, time and venue (or why it is off). */
export function toFixture(match: ScheduledMatch, venue: string): Fixture {
  const title = match.stage === 'League' ? `Match ${match.number}` : `Match ${match.number}, ${match.stage}`;
  const linked = match.match;
  const state = linked?.status === 'live' ? 'live' : linked?.status === 'completed' ? 'result' : 'upcoming';
  const displaySide = (side: SideRef, runs: number | null | undefined, wickets: number | null | undefined,
    balls: number | null | undefined, winner: string) => ({
    team: teamInfo(side), score: runs != null ? `${runs}/${wickets ?? 0}` : '',
    overs: state !== 'upcoming' && runs != null ? formatOvers(balls, linked?.overs_limit) : undefined,
    emphasised: state !== 'result' || linked?.winner_side === winner,
  });
  return {
    id: match.id,
    state,
    completedAt: state === 'result' ? linked?.completed_at ?? undefined : undefined,
    title: match.cancelled ? `${title} · Cancelled` : title,
    date: match.date,
    day: format(parseISO(match.date), 'EEE, d MMM'),
    time: timeLabel(match.startMin),
    sides: [
      displaySide(match.home, linked?.team_a_runs, linked?.team_a_wickets, linked?.team_a_balls, 'a'),
      displaySide(match.away, linked?.team_b_runs, linked?.team_b_wickets, linked?.team_b_balls, 'b'),
    ],
    note: match.cancelled ? `Cancelled: ${match.cancelled.reason}` : state === 'result' ? linked?.result_summary ?? 'Match completed' : venue,
  };
}
