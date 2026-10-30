import type { MatchSetup, ScorerTeam } from '@/features/scoring/types';

import type { FriendlyMatchSetup, FriendlyTeamSquad } from '../types';
import { teamLabel } from './toss';

const scorerTeam = (squad: FriendlyTeamSquad, label: string): ScorerTeam => ({
  team: { name: label, short: squad.short || label.slice(0, 2).toUpperCase(), tone: squad.tone, avatarUri: squad.imageUri },
  players: squad.players.map((p) => ({ id: p.id, name: p.name, role: p.role, profileId: p.userId })),
});

/**
 * The scorer's setup for a tossed friendly. Team A takes the scorer's first slot, team B the second. Openers are
 * left for the scorer to choose; `preset` tells the scorer the toss and sides are already settled.
 */
export function toScorerSetup(setup: FriendlyMatchSetup, creatorId: string): MatchSetup {
  if (!setup.toss) throw new Error('Toss the coin before scoring.');
  const [a, b] = [teamLabel(setup, 'teamA'), teamLabel(setup, 'teamB')];
  const playing = (squad: FriendlyTeamSquad) => squad.players.filter((p) => p.playing).map((p) => p.id);
  const scorer = setup.assignedScorerId;
  return {
    title: `Friendly · ${a} vs ${b}`,
    teams: { KK: scorerTeam(setup.teamA, a), CS: scorerTeam(setup.teamB, b) },
    playersPerSide: setup.playersPerSide, preset: true,
    scorerIds: scorer && scorer !== creatorId ? [scorer] : [],
    tossWinner: setup.toss.winner === 'teamA' ? 'KK' : 'CS', decision: setup.toss.decision,
    playingXi: { KK: playing(setup.teamA), CS: playing(setup.teamB) },
    strikerId: '', nonStrikerId: '', bowlerId: '', recordShots: true, oversLimit: setup.overs,
  };
}
