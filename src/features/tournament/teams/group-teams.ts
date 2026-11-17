import type { EnteredTeam } from '../data/tournament-repository';

/** Splits the entered teams into those still playing and those knocked out, keeping join order. */
export function groupTeams(teams: EnteredTeam[]): { active: EnteredTeam[]; eliminated: EnteredTeam[] } {
  return { active: teams.filter((t) => !t.eliminated), eliminated: teams.filter((t) => t.eliminated) };
}

/** The line under the count: who is still in, or how many places are left. */
export function teamsSummary(joined: number, planned: number, eliminated: number): string {
  if (eliminated > 0) return `${joined - eliminated} still in · ${eliminated} eliminated`;
  const open = planned - joined;
  if (open > 0) return open === 1 ? '1 place left' : `${open} places left`;
  return 'Line-up complete';
}

/** Share of planned places filled, 0..1; never NaN. */
export function fillRatio(joined: number, planned: number): number {
  return planned > 0 ? Math.min(1, Math.max(0, joined / planned)) : 0;
}
