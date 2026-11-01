// What other features may use from teams.
export { createTeam, fetchMyTeams, fetchTeam, myTeamsKey, teamKey, toTeam, type MyTeam, type TeamRecord, type TeamRole } from './data/team-repository';
export { teamErrorText, TeamError } from './data/team-errors';
export { cleanShortName, suggestShortName, teamProblem, teamTones, type NewTeamInput } from './data/team-rules';
export { useOpenTeam } from './use-team-routes';
