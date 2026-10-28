/** Who runs a tournament: its author (one) and the moderators they invite. */
export type TournamentRole = 'owner' | 'moderator';

/** An invite is pending until the person accepts it. A declined or cancelled invite is removed. */
export type InviteStatus = 'pending' | 'accepted';

/** The public part of a profile, enough to find and invite someone. */
export type UserSummary = { id: string; name: string; area: string | null; avatarUrl: string | null };

export type StaffMember = { user: UserSummary; role: TournamentRole; status: InviteStatus };

/** A team's owner, once invited. They later invite the players and one team moderator. */
export type TeamOwnerSlot = { user: UserSummary; status: InviteStatus };

export type RosterTeam = { id: string; name: string; short: string; owner: TeamOwnerSlot | null };

/** Everyone and every team in one tournament. `maxTeams` comes from the tournament's "Number of teams". */
export type Roster = { tournamentId: string; maxTeams: number; staff: StaffMember[]; teams: RosterTeam[] };

export type NewTeam = { name: string; short: string };
