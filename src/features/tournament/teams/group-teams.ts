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

/** "Group A" for 0, "Group B" for 1, … */
export const groupName = (index: number): string => `Group ${String.fromCharCode(65 + index)}`;

/** The teams of each group in join order, or null while any team is still waiting for the draw. */
export function splitIntoGroups<T extends { group: number | null }>(teams: T[], groups: number): T[][] | null {
  if (teams.length === 0 || teams.some((t) => t.group == null || t.group >= groups)) return null;
  return Array.from({ length: groups }, (_, g) => teams.filter((t) => t.group === g));
}
