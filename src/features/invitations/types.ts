/** What accepting gives: a seat on a tournament's staff, or ownership of one of its teams. */
export type InvitationKind = 'tournament-moderator' | 'team-owner';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

/** An invite addressed to the signed-in person. */
export type Invitation = {
  id: string;
  kind: InvitationKind;
  tournamentName: string;
  /** The team, for a team owner invite. */
  teamName: string | null;
  fromName: string;
  /** When it was sent, as shown, e.g. "2h ago". */
  sentLabel: string;
  status: InvitationStatus;
};
