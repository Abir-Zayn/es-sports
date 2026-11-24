import type { StandingsRow } from '../data/standings-repository';
import type { RoundView } from '../data/rounds-repository';
import type { ScheduledMatch } from '../schedule-builder/types';

/** These counts start the straight knockout; any other count plays another group round. */
export const KNOCKOUT_SIZES = [2, 4, 8] as const;
export const isKnockoutSize = (n: number) => (KNOCKOUT_SIZES as readonly number[]).includes(n);

/** The stage to offer first: 2, 4 or 8 teams most often play a knockout (final, semi-finals, quarter-finals). */
export const nextStageFor = (n: number): 'groups' | 'knockout' => (isKnockoutSize(n) ? 'knockout' : 'groups');

/** The round's league matches exist and every one is finished or cancelled. */
export function isRoundComplete(round: RoundView, matches: ScheduledMatch[]): boolean {
  const own = matches.filter((m) => m.stage === 'League' && m.round === round.round);
  return own.length > 0 && own.every((m) => m.cancelled || m.match?.status === 'completed');
}

/**
 * Every team of the round ranked by place, then group: A1, B1, A2, B2, … `rows` come in table order, so a team's
 * place is its index among the rows of its group. Teams missing from the table go last.
 */
export function rankByPlace(round: RoundView, rows: StandingsRow[]): string[] {
  const place = new Map<string, number>();
  const seen = new Map<number, number>();
  for (const row of rows) {
    const g = row.teamId ? round.groupOf.get(row.teamId) : undefined;
    if (g == null || !row.teamId) continue;
    place.set(row.teamId, seen.get(g) ?? 0);
    seen.set(g, (seen.get(g) ?? 0) + 1);
  }
  const key = (id: string) => (place.get(id) ?? 99) * 10 + (round.groupOf.get(id) ?? 9);
  return [...round.teamIds].sort((a, b) => key(a) - key(b));
}

/** The top `perGroup` of each group, in rank order. */
export const topOfEachGroup = (round: RoundView, ranked: string[], perGroup: number) => ranked.slice(0, perGroup * round.groups);

/** Bracket positions of seeds 1..n so the top two seeds can only meet in the final: 4 → [1, 4, 2, 3]. */
export function seedOrder(n: number): number[] {
  let order = [1];
  while (order.length < n) {
    const size = order.length * 2;
    order = order.flatMap((s) => [s, size + 1 - s]);
  }
  return order;
}

/** Ranked teams placed in bracket slots: slot 0 meets slot 1, 2 meets 3, and so on. */
export const bracketSlots = (ranked: string[]) => seedOrder(ranked.length).map((seed) => ranked[seed - 1]);

/** Group counts that split `n` teams evenly with at least 3 in each, up to 8 groups. */
export const groupChoices = (n: number) => [1, 2, 3, 4, 5, 6, 7, 8].filter((g) => n % g === 0 && n >= 3 * g);

/** The same teams in a random order (Fisher-Yates); `random` is injectable for tests. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
