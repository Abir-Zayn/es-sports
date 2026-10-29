// In-memory stand-in for the invitations table until it lives in Supabase. Accepting a team owner invite makes
// the person the team's owner; the database will do both in one transaction.
import { acceptTeamOwnerInvite, type UserSummary } from '@/features/tournament/roster';

import type { Invitation } from './types';

const LATENCY_MS = 200;

const seed: Invitation[] = [
  {
    id: 'inv-1',
    kind: 'team-owner',
    tournamentId: 'hsf-2026',
    tournamentName: 'HSF Premier League 2026',
    teamId: 'hsf-bb',
    teamName: 'Bayazid Blasters',
    fromName: 'Arif Chowdhury',
    sentLabel: '2h ago',
    status: 'pending',
  },
  {
    id: 'inv-2',
    kind: 'tournament-moderator',
    tournamentId: 'port-city-winter',
    tournamentName: 'Port City Winter Cup',
    teamId: null,
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

/**
 * Accepts or declines a pending invite as `me`. Answering one that was already answered changes nothing.
 * Accepting a team owner invite hands `me` the team first, so a refused hand-over leaves the invite pending.
 */
export async function answerInvitation(id: string, answer: 'accepted' | 'declined', me: UserSummary): Promise<Invitation[]> {
  await wait();
  const invite = invitations.find((i) => i.id === id && i.status === 'pending');
  if (!invite) return invitations;
  if (answer === 'accepted' && invite.kind === 'team-owner' && invite.teamId) {
    await acceptTeamOwnerInvite(invite.tournamentId, invite.teamId, me);
  }
  invitations = invitations.map((i) => (i.id === id ? { ...i, status: answer } : i));
  return invitations;
}

/** Puts the sample invites back. Tests only. */
export function resetInvitations() {
  invitations = seed.map((invite) => ({ ...invite }));
}
