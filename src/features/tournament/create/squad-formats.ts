/** How many play on each side, and how few and how many players a team's squad may have. */
export type SquadRules = { playersPerSide: number; minSquad: number; maxSquad: number };

export const sideFormats = ['gully_6', 'tapeball_8', 'local_10', 'standard_11', 'custom'] as const;
export type SideFormat = (typeof sideFormats)[number];

export const SQUAD_LIMITS = { sideMin: 6, sideMax: 11, squadMax: 16 } as const;

/** Local cricket is rarely eleven a side, so each preset matches a common game and its usual squad size. */
export const sideFormatPresets: { value: SideFormat; label: string; detail: string; rules: SquadRules | null }[] = [
  { value: 'gully_6', label: 'Gully, 6 a side', detail: 'Short pitch. Squads of 8 to 10.', rules: { playersPerSide: 6, minSquad: 8, maxSquad: 10 } },
  { value: 'tapeball_8', label: 'Tape-ball, 8 a side', detail: 'Squads of 10 to 12.', rules: { playersPerSide: 8, minSquad: 10, maxSquad: 12 } },
  { value: 'local_10', label: 'Local, 10 a side', detail: 'Squads of 12 to 14.', rules: { playersPerSide: 10, minSquad: 12, maxSquad: 14 } },
  { value: 'standard_11', label: 'Full, 11 a side', detail: 'District standard. Squads of 14 to 16.', rules: { playersPerSide: 11, minSquad: 14, maxSquad: 16 } },
  { value: 'custom', label: 'Custom', detail: 'Set the side and squad sizes yourself.', rules: null },
];

export const defaultSquadRules: SquadRules = { playersPerSide: 11, minSquad: 14, maxSquad: 16 };

/** The preset's sizes, or null for a custom format. */
export function presetRules(format: SideFormat): SquadRules | null {
  return sideFormatPresets.find((preset) => preset.value === format)?.rules ?? null;
}

/** Why these sizes do not work together, or null when they do. */
export function squadRulesProblem({ playersPerSide, minSquad, maxSquad }: SquadRules): string | null {
  const { sideMin, sideMax, squadMax } = SQUAD_LIMITS;
  if (!Number.isInteger(playersPerSide) || playersPerSide < sideMin || playersPerSide > sideMax) return `Choose ${sideMin} to ${sideMax} players a side.`;
  if (!Number.isInteger(minSquad) || minSquad < playersPerSide) return 'The smallest squad must cover a full side.';
  if (!Number.isInteger(maxSquad) || maxSquad < minSquad) return 'The largest squad cannot be smaller than the smallest.';
  if (maxSquad > squadMax) return `Squads are limited to ${squadMax} players.`;
  return null;
}

/** "6 a side · squads of 8 to 10". */
export function describeRules({ playersPerSide, minSquad, maxSquad }: SquadRules): string {
  return `${playersPerSide} a side · squads of ${minSquad} to ${maxSquad}`;
}
