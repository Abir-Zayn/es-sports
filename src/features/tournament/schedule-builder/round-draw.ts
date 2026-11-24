import { format, parseISO } from 'date-fns';

import { generatePairings, knockoutPairings, pairingProblem } from './generate';
import { placeMatches } from './slots';
import type { Competition, Pairing, RoundPlan, ScheduledMatch, ScheduleTeam, SlotSettings } from './types';

type Drawn = { matches: ScheduledMatch[]; problem: null } | { matches: null; problem: string };

const inPlan = (plan: RoundPlan, m: ScheduledMatch) =>
  plan.kind === 'knockout' ? m.stage !== 'League' : m.stage === 'League' && m.round === plan.round;

/**
 * The whole schedule after drawing one round. Without a plan every match is drawn again. With one, matches of other
 * rounds stay as they are and this round's matches are numbered after them, on days after the last of them and not
 * before `today` (a later round cannot be played in the past).
 */
export function drawSchedule(
  plan: RoundPlan | undefined, teams: ScheduleTeam[], competition: Competition, current: ScheduledMatch[],
  days: string[], settings: SlotSettings, overs: number, today?: string,
): Drawn {
  const keep = plan ? current.filter((m) => !inPlan(plan, m)) : [];
  const start = keep.reduce((max, m) => Math.max(max, m.number), 0);
  let pairings: Pairing[];
  if (!plan) {
    const refused = pairingProblem(teams.length, competition);
    if (refused) return { matches: null, problem: refused };
    pairings = generatePairings(teams, competition);
  } else if (plan.kind === 'groups') {
    if (!plan.groupIds) return { matches: null, problem: 'Draw the groups first.' };
    pairings = generatePairings(teams, 'league', plan.groupIds).map((p) => ({ ...p, number: p.number + start, round: plan.round }));
  } else {
    const slotted = plan.slots.flatMap((id) => teams.filter((t) => t.id === id));
    if (slotted.length !== plan.slots.length || slotted.length < 2) return { matches: null, problem: 'A team in the knockout is no longer entered.' };
    pairings = knockoutPairings(slotted, start);
  }
  const lastDay = keep.reduce((last, m) => (m.date > last ? m.date : last), '');
  const open = days.filter((d) => d > lastDay && (!plan || !today || d >= today));
  if (plan && open.length === 0) {
    const end = days[days.length - 1] ?? lastDay;
    return { matches: null, problem: `No days are left for this round: the tournament ends on ${end ? format(parseISO(end), 'd MMM') : 'its last day'}. Move the end date in Edit tournament, then draw again.` };
  }
  const placed = placeMatches(pairings, open, settings, overs);
  return placed.problem ? { matches: null, problem: placed.problem } : { matches: [...keep, ...placed.matches], problem: null };
}
