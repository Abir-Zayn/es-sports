// What other features may use from teams.
export {
  createTeam, fetchMyTeams, fetchTeam, fetchTeamMembers, myTeamsKey, teamKey, toTeam,
  type Availability, type MyTeam, type TeamMemberRecord, type TeamRecord, type TeamRole,
} from './data/team-repository';
export { availabilityLabel, teamMembersKey } from './data/team-management';
export { teamErrorText, TeamError } from './data/team-errors';
export { cleanShortName, suggestShortName, teamProblem, teamTones, type NewTeamInput } from './data/team-rules';
export { useOpenTeam } from './use-team-routes';
