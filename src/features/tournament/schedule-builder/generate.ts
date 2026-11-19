import type { Competition, Pairing, ScheduleTeam, SideRef, StageName } from './types';

const team = (t: ScheduleTeam): SideRef => ({ kind: 'team', team: t });
const tbd = (label: string): SideRef => ({ kind: 'tbd', label });

const isPowerOfTwo = (n: number) => n >= 2 && (n & (n - 1)) === 0;

/** League opponents must be members of the same drawn group. */
export function groupMatchProblem(home: string, away: string, groups?: string[][] | null): string | null {
  if (groups === undefined) return null;
  if (groups === null) return 'Draw the groups first.';
  return groups.some((group) => group.includes(home) && group.includes(away)) ? null : 'Pick two teams from the same group.';
}

/** The knockout round named by how many sides are left in it. */
function knockoutStage(sides: number): StageName {
  if (sides >= 16) return 'Round of 16';
  if (sides === 8) return 'Quarter-final';
  if (sides === 4) return 'Semi-final';
  return 'Final';
}

/**
 * Every team plays every other once, as rounds where no team plays twice (the circle method). With an odd
 * number of teams one sits out each round.
 */
export function roundRobin(teams: ScheduleTeam[]): [ScheduleTeam, ScheduleTeam][][] {
  const ring: (ScheduleTeam | null)[] = teams.length % 2 === 0 ? [...teams] : [...teams, null];
  const n = ring.length;
  const rounds: [ScheduleTeam, ScheduleTeam][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [ScheduleTeam, ScheduleTeam][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = ring[i];
      const b = ring[n - 1 - i];
      // Alternate who is listed first so no team is always "home".
      if (a && b) round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    // Keep the first team fixed and turn the rest one place.
    ring.splice(1, 0, ring.pop() as ScheduleTeam | null);
  }
  return rounds;
}

/** Each group's round robin, merged so round 1 of every group comes first, then round 2, and so on. */
export function groupRoundRobin(teams: ScheduleTeam[], groupIds: string[][]): [ScheduleTeam, ScheduleTeam][][] {
  const perGroup = groupIds.map((ids) => roundRobin(teams.filter((t) => ids.includes(t.id))));
  const rounds = Math.max(0, ...perGroup.map((r) => r.length));
  return Array.from({ length: rounds }, (_, r) => perGroup.flatMap((group) => group[r] ?? []));
}

/**
 * A fixed bracket from teams in slot order (slot 0 meets slot 1, 2 meets 3, …), numbered after `start`. Later rounds
 * name the matches that feed them, e.g. "Winner of Match 9"; the owner's confirmed winner fills that side.
 */
export function knockoutPairings(slotted: ScheduleTeam[], start = 0): Pairing[] {
  const pairings: Pairing[] = [];
  const add = (stage: StageName, round: number, home: SideRef, away: SideRef) => {
    pairings.push({ number: start + pairings.length + 1, stage, round, home, away });
    return start + pairings.length;
  };
  let feeders: number[] = [];
  for (let i = 0; i + 1 < slotted.length; i += 2) feeders.push(add(knockoutStage(slotted.length), 1, team(slotted[i]), team(slotted[i + 1])));
  for (let round = 2; feeders.length > 1; round++) {
    const stage = knockoutStage(feeders.length);
    const next: number[] = [];
    for (let i = 0; i < feeders.length; i += 2) next.push(add(stage, round, tbd(`Winner of Match ${feeders[i]}`), tbd(`Winner of Match ${feeders[i + 1]}`)));
    feeders = next;
  }
  return pairings;
}

/** Why no schedule can be drawn for these teams, or null when it can. */
export function pairingProblem(teamCount: number, competition: Competition): string | null {
  if (teamCount < 2) return 'Add at least 2 teams to draw a schedule.';
  if (competition === 'knockout' && !isPowerOfTwo(teamCount)) {
    return `A knockout needs 2, 4, 8 or 16 teams. This tournament has ${teamCount}.`;
  }
  return null;
}

/**
 * Every match of the tournament in play order, numbered from 1. `groupIds` (team ids per group) splits the league. A knockout pairs the first team added with
 * the last, the second with the second last, and so on. Later rounds name the matches that feed them.
 */
export function generatePairings(teams: ScheduleTeam[], competition: Competition, groupIds?: string[][]): Pairing[] {
  if (pairingProblem(teams.length, competition)) return [];
  const pairings: Pairing[] = [];
  const add = (stage: StageName, round: number, home: SideRef, away: SideRef) => {
    pairings.push({ number: pairings.length + 1, stage, round, home, away });
    return pairings.length;
  };

  if (competition === 'knockout') {
    let feeders: number[] = [];
    const first = knockoutStage(teams.length);
    for (let i = 0; i < teams.length / 2; i++) feeders.push(add(first, 1, team(teams[i]), team(teams[teams.length - 1 - i])));
    for (let round = 2; feeders.length > 1; round++) {
      const stage = knockoutStage(feeders.length);
      const next: number[] = [];
      for (let i = 0; i < feeders.length; i += 2) {
        next.push(add(stage, round, tbd(`Winner of Match ${feeders[i]}`), tbd(`Winner of Match ${feeders[i + 1]}`)));
      }
      feeders = next;
    }
    return pairings;
  }

  // With groups, teams only meet the others in their group.
  for (const round of groupIds ? groupRoundRobin(teams, groupIds) : roundRobin(teams)) {
    for (const [home, away] of round) add('League', 0, team(home), team(away));
  }
  if (competition === 'league-knockout') {
    if (teams.length >= 4) {
      const sf1 = add('Semi-final', 1, tbd('1st in league'), tbd('4th in league'));
      const sf2 = add('Semi-final', 1, tbd('2nd in league'), tbd('3rd in league'));
      add('Final', 2, tbd(`Winner of Match ${sf1}`), tbd(`Winner of Match ${sf2}`));
    } else {
      add('Final', 1, tbd('1st in league'), tbd('2nd in league'));
    }
  }
  return pairings;
}
