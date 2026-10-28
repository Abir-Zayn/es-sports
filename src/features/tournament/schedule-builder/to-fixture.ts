import { format, parseISO } from 'date-fns';

import type { Fixture, TeamInfo } from '@/types/cricket';

import { timeLabel } from './slots';
import type { ScheduledMatch, SideRef } from './types';

const teamInfo = (side: SideRef): TeamInfo =>
  side.kind === 'team' ? { short: side.team.short, name: side.team.name, tone: 'neutral' } : { short: 'TBD', name: side.label, tone: 'neutral' };

/** A scheduled match as the shared match tile shows it: number and stage, date, time and venue. */
export function toFixture(match: ScheduledMatch, venue: string): Fixture {
  return {
    id: match.id,
    state: 'upcoming',
    title: match.stage === 'League' ? `Match ${match.number}` : `Match ${match.number}, ${match.stage}`,
    date: match.date,
    day: format(parseISO(match.date), 'EEE, d MMM'),
    time: timeLabel(match.startMin),
    sides: [
      { team: teamInfo(match.home), score: '', emphasised: true },
      { team: teamInfo(match.away), score: '', emphasised: true },
    ],
    note: venue,
  };
}
