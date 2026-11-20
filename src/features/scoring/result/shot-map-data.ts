import type { ShotMapTeam, WagonBatter } from '@/features/match/types';

import type { ScoreState, TeamCode } from '../types';
import type { InningsSide } from './innings-sides';

export const teamOf = (code: TeamCode, teams: ScoreState['teams']): ShotMapTeam => ({ key: code, name: teams[code].name, short: teams[code].short });

/** The match summary's innings in the shot map's shape: each batter with directed shots, tagged with their side. */
export function wagonBattersOf(sides: InningsSide[], teams: ScoreState['teams']): WagonBatter[] {
  return sides.flatMap((side) => side.batters.flatMap((b) => {
    const shots = side.shots.filter((s) => s.batterId === b.id).map(({ runs, angle }) => ({ runs, angle }));
    if (shots.length === 0) return [];
    return [{ id: `${side.code}:${b.id}`, name: b.name, line: '', score: `${b.runs}${b.out ? '' : '*'}`, team: teamOf(side.code, teams), shots }];
  }));
}
