import { isDateKey, teamCounts, type TournamentDraft } from '../create/draft';
import { defaultSquadRules, squadRulesProblem } from '../create/squad-formats';
import type { RosterSetup } from './types';

/** Route params the setup screen hands to the teams screen. Every value is a string. */
export type SetupParams = {
  tournamentId?: string; teams?: string; name?: string; side?: string; minSquad?: string; maxSquad?: string; opens?: string; deadline?: string; starts?: string;
};

export function setupParams(draft: TournamentDraft): Required<Omit<SetupParams, 'tournamentId'>> {
  return {
    teams: String(draft.teams),
    name: draft.name,
    side: String(draft.playersPerSide),
    minSquad: String(draft.minSquad),
    maxSquad: String(draft.maxSquad),
    opens: draft.registrationOpens,
    deadline: draft.registrationDeadline,
    starts: draft.startDate,
  };
}

const dateOrEmpty = (value: string | undefined) => (value && isDateKey(value) ? value : '');

/** Reads the params defensively: a team count the setup does not offer becomes 8, bad sizes the 11-a-side default. */
export function parseSetup(params: SetupParams): RosterSetup {
  const count = Number(params.teams);
  const rules = { playersPerSide: Number(params.side), minSquad: Number(params.minSquad), maxSquad: Number(params.maxSquad) };
  const startsOn = dateOrEmpty(params.starts);
  return {
    tournamentName: params.name?.trim() || 'Untitled tournament',
    maxTeams: (teamCounts as readonly number[]).includes(count) ? count : 8,
    squadRules: squadRulesProblem(rules) ? defaultSquadRules : rules,
    // An empty deadline means registration runs until the tournament starts.
    registration: { opensOn: dateOrEmpty(params.opens), deadline: dateOrEmpty(params.deadline) || startsOn },
    startsOn,
  };
}
