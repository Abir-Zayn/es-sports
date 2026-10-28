// In-memory stand-in for the invitations table until it lives in Supabase. Accepting will add the person to the
// tournament staff or make them the team's owner; the database will do that in one transaction.
import type { Invitation } from './types';

const LATENCY_MS = 200;

const seed: Invitation[] = [
  {
    id: 'inv-1',
    kind: 'team-owner',
    tournamentName: 'HSF Premier League 2026',
    teamName: 'Bayazid Blasters',
    fromName: 'Arif Chowdhury',
    sentLabel: '2h ago',
    status: 'pending',
  },
  {
    id: 'inv-2',
    kind: 'tournament-moderator',
    tournamentName: 'Port City Winter Cup',
    teamName: null,
    fromName: 'Tanvir Ahmed',
    sentLabel: 'Yesterday',
    status: 'pending',
  },
];

let invitations = seed.map((invite) => ({ ...invite }));

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

export async function fetchInvitations(): Promise<Invitation[]> {
  await wait();
  return invitations;
}

/** Accepts or declines a pending invite. Answering one that was already answered changes nothing. */
export async function answerInvitation(id: string, answer: 'accepted' | 'declined'): Promise<Invitation[]> {
  await wait();
  invitations = invitations.map((invite) => (invite.id === id && invite.status === 'pending' ? { ...invite, status: answer } : invite));
  return invitations;
}

/** Puts the sample invites back. Tests only. */
export function resetInvitations() {
  invitations = seed.map((invite) => ({ ...invite }));
}
