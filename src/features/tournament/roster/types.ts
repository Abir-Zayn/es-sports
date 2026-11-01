import type { SquadRules } from '../create/squad-formats';

/** Who runs a tournament: its author (one) and the moderators they invite. */
export type TournamentRole = 'owner' | 'moderator';

/** An invite is pending until the person accepts it. A declined or cancelled invite is removed. */
export type InviteStatus = 'pending' | 'accepted';

/** The public part of a profile, enough to find and invite someone. */
export type UserSummary = { id: string; name: string; area: string | null; avatarUrl: string | null };

export type StaffMember = { user: UserSummary; role: TournamentRole; status: InviteStatus };

/** A team's owner, once invited. They later invite the players and one team moderator. */
export type TeamOwnerSlot = { user: UserSummary; status: InviteStatus };

export const playerRoles = ['Batter', 'Bowler', 'All-rounder', 'Keeper'] as const;
export type PlayerRole = (typeof playerRoles)[number];

/**
 * One player in a team's squad. A player added by name and phone alone has no `userId` yet: they are a guest
 * whose matches still count, and the `claimToken` link lets them take the profile over when they join.
 */
export type TournamentPlayer = {
  id: string;
  name: string;
  role: PlayerRole;
  userId: string | null;
  phone: string | null;
  claimToken: string | null;
  addedAt: string;
  /** Added after the rosters were locked, so the organisers were alerted. */
  addedDuringTournament: boolean;
};

/**
 * One team. A team read from the server also has `ownedByMe`: the viewer owns it now, so `owner` stays empty until an
 * owner request is pending. Squads are chosen per match, so a server team lists no players here.
 */
export type RosterTeam = {
  id: string; name: string; short: string; owner: TeamOwnerSlot | null; players: TournamentPlayer[];
  ownedByMe?: boolean;
};

/** When team owners may add players. The organiser can move the deadline or close and re-open early. */
export type RegistrationWindow = {
  /** Date key, or empty to be open from the start. */
  opensOn: string;
  /** Last day players can be added, or empty to stay open until the rosters lock. */
  deadline: string;
  closedEarly: boolean;
};

export type RegistrationStatus = 'upcoming' | 'open' | 'closed' | 'locked';

/** A squad change made after the rosters locked. Each one alerts the tournament owner and moderators. */
export type RosterAuditEvent = {
  id: string;
  teamId: string;
  teamName: string;
  action: 'player_added' | 'player_removed';
  playerName: string;
  byName: string;
  reason: string;
  at: string;
};

/** Everyone and every team in one tournament. `maxTeams` comes from the tournament's "Number of teams". */
export type Roster = {
  tournamentId: string;
  tournamentName: string;
  maxTeams: number;
  squadRules: SquadRules;
  registration: RegistrationWindow;
  /** Date key of the first match day, or empty when not set. */
  startsOn: string;
  /** Once locked, squad changes need a reason and alert the organisers. It cannot be undone. */
  locked: boolean;
  staff: StaffMember[];
  teams: RosterTeam[];
  /** Newest first. */
  audit: RosterAuditEvent[];
  /** Read from the server. Registration windows, locking, schedules and disbanding are not stored there yet. */
  server?: true;
};

/** What tournament setup decides about the roster. Registration dates seed the window only once. */
export type RosterSetup = {
  tournamentName: string;
  maxTeams: number;
  squadRules: SquadRules;
  registration: { opensOn: string; deadline: string };
  startsOn: string;
};

export type NewTeam = { name: string; short: string };

/** A guest player: enough to fill the squad on match day. */
export type GuestPlayerInput = { name: string; phone: string; role: PlayerRole };
