import type { TeamMemberRecord, TeamRecord } from '@/features/team/data/team-repository';

import type { FriendlyMatchSetup, FriendlySide, FriendlyTeamSquad } from '../types';

/**
 * One side played by an existing team: its name, colour and picture, and its members as the squad, the first ones
 * playing up to the side size and the rest on the bench. Staff do not play. Injured or resting members sit out.
 */
export function squadFromTeam(team: TeamRecord, members: TeamMemberRecord[], playersPerSide: number, newId: () => string): FriendlyTeamSquad {
  const players = members.filter((m) => m.role !== 'staff')
    .sort((a, b) => Number(b.availability === 'available') - Number(a.availability === 'available'));
  return {
    teamId: team.id, name: team.name, short: team.shortName, tone: team.tone, ...(team.logoUrl ? { imageUri: team.logoUrl } : {}),
    players: players.map((m, index) => ({
      id: newId(), name: m.name, role: 'All-rounder', userId: m.profileId, avatarUrl: m.avatarUrl, phone: null,
      playing: index < playersPerSide && m.availability === 'available',
    })),
  };
}

/** The setup with `side` played by that team. */
export const withTeam = (setup: FriendlyMatchSetup, side: FriendlySide, squad: FriendlyTeamSquad): FriendlyMatchSetup => ({ ...setup, [side]: squad });
