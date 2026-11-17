import { z } from 'zod';

import { SQUAD_LIMITS, defaultSquadRules, sideFormats, squadRulesProblem } from './squad-formats';

/** Labels for tournaments published before the format choice was removed. New tournaments are always round robin;
 * the owner eliminates teams by hand from the teams screen. */
export const competitionFormats = [
  { value: 'league-knockout', label: 'League + knockout', detail: 'A league stage, then the race to the final.' },
  { value: 'league', label: 'Round robin', detail: 'Every team plays every other team.' },
  { value: 'knockout', label: 'Single elimination', detail: 'A team is eliminated after one loss.' },
] as const;
/** Overs per side: any whole number in this range. 10, 20 and 50 are the T10, T20 and one-day formats. */
export const OVERS = { min: 4, max: 50, default: 20 } as const;
/** Quick picks: common local formats, plus T10, T20 and one-day. Anything else in range is set with the stepper. */
export const oversPresets = [6, 8, 10, 12, 15, 20, 50] as const;
export const oversFormatName = (overs: number): string | undefined => ({ 10: 'T10', 20: 'T20', 50: 'ODI' } as Record<number, string>)[overs];
export const oversLabel = (overs: number): string => `${overs} overs`;
/** Drafts saved before custom overs held one of three formats. */
const legacyOvers: Record<string, number> = { T10: 10, T20: 20, ODI: 50 };

function upgradeLegacyDraft(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || 'overs' in raw || !('matchFormat' in raw)) return raw;
  const { matchFormat, ...rest } = raw as Record<string, unknown>;
  return { ...rest, overs: typeof matchFormat === 'string' ? legacyOvers[matchFormat] ?? OVERS.default : OVERS.default };
}
/** Teams a new tournament plans for. Tournaments published earlier may have 4. */
export const TEAMS = { min: 6, max: 48, default: 8 } as const;
/** Groups the teams split into; 1 is a single round robin. Each group needs at least 3 teams. */
export const GROUPS = { min: 1, max: 8, perGroupMin: 3 } as const;

/** The team counts that fit `groups`: a multiple of it, at least 3 per group, within TEAMS. */
export function teamRange(groups: number): { min: number; max: number; step: number } {
  const step = Math.max(1, groups);
  const min = Math.ceil(Math.max(TEAMS.min, GROUPS.perGroupMin * step) / step) * step;
  return { min, max: Math.floor(TEAMS.max / step) * step, step };
}
/** Quick picks for the team count: common sizes for one group, else 3 to 8 teams in each group. */
export function teamPresets(groups: number): number[] {
  const { min, max, step } = teamRange(groups);
  const picks = step === 1 ? [6, 8, 10, 12, 16, 20, 24, 32, 48] : [3, 4, 5, 6, 8].map((k) => k * step);
  return picks.filter((n) => n >= min && n <= max);
}
/** The nearest team count that fits `groups`. */
export function fitTeams(teams: number, groups: number): number {
  const { min, max, step } = teamRange(groups);
  return Math.min(max, Math.max(min, Math.round(teams / step) * step));
}

/** Older drafts may hold a knockout format or fewer than 6 teams; every draft is now a round robin of 6 to 48. */
function upgradeDraft(raw: unknown): unknown {
  const upgraded = upgradeLegacyDraft(raw);
  if (typeof upgraded !== 'object' || upgraded === null) return upgraded;
  const { teams } = upgraded as { teams?: unknown };
  // Drafts saved with 4 teams move up to the new minimum.
  return { ...upgraded, competition: 'league', ...(typeof teams === 'number' && teams < TEAMS.min ? { teams: TEAMS.min } : {}) };
}
export const draftSchema = z.preprocess(upgradeDraft, z.object({
  version: z.literal(1),
  name: z.string().max(80),
  city: z.string().max(60),
  venue: z.string().max(80),
  startDate: z.string().max(10),
  endDate: z.string().max(10).default(''),
  coverUri: z.string().max(3_000_000).default(''),
  profileUri: z.string().max(3_000_000).default(''),
  overs: z.number().int().min(OVERS.min).max(OVERS.max).default(OVERS.default),
  competition: z.enum(['league-knockout', 'league', 'knockout']).default('league'),
  teams: z.number().int().min(TEAMS.min).max(TEAMS.max),
  groups: z.number().int().min(GROUPS.min).max(GROUPS.max).default(GROUPS.min),
  ball: z.enum(['Tennis', 'Leather']),
  sideFormat: z.enum(sideFormats).default('standard_11'),
  playersPerSide: z.number().int().min(SQUAD_LIMITS.sideMin).max(SQUAD_LIMITS.sideMax).default(defaultSquadRules.playersPerSide),
  minSquad: z.number().int().min(SQUAD_LIMITS.sideMin).max(SQUAD_LIMITS.squadMax).default(defaultSquadRules.minSquad),
  maxSquad: z.number().int().min(SQUAD_LIMITS.sideMin).max(SQUAD_LIMITS.squadMax).default(defaultSquadRules.maxSquad),
  /** Both optional: empty means open from now, and until the tournament starts. */
  registrationOpens: z.string().max(10).default(''),
  registrationDeadline: z.string().max(10).default(''),
}));
export type TournamentDraft = z.output<typeof draftSchema>;
export type DraftErrors = Partial<Record<keyof TournamentDraft, string>>;
export const emptyDraft: TournamentDraft = {
  version: 1, name: '', city: '', venue: '', startDate: '', endDate: '', coverUri: '', profileUri: '',
  overs: OVERS.default, competition: 'league', teams: TEAMS.default, groups: GROUPS.min, ball: 'Tennis',
  sideFormat: 'standard_11', ...defaultSquadRules, registrationOpens: '', registrationDeadline: '',
};

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDateKey(value: string): boolean {
  return formatDate(value) !== 'Choose a date';
}

export function formatDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Choose a date';
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || localDateKey(date) !== value) return 'Choose a date';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function validateDraft(draft: TournamentDraft, today = localDateKey(new Date())): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.name.trim().length < 3) errors.name = 'Enter a tournament name of at least 3 characters.';
  if (draft.city.trim().length < 2) errors.city = 'Enter the city or area.';
  if (draft.venue.trim().length < 2) errors.venue = 'Enter the ground or venue.';
  if (formatDate(draft.startDate) === 'Choose a date' || draft.startDate < today) errors.startDate = 'Choose today or a future start date.';
  if (formatDate(draft.endDate) === 'Choose a date') errors.endDate = 'Choose an end date.';
  else if (draft.endDate < draft.startDate) errors.endDate = 'End date must be on or after the start date.';
  if (fitTeams(draft.teams, draft.groups) !== draft.teams) errors.teams = `With ${draft.groups} groups, choose a multiple of ${draft.groups} with at least ${GROUPS.perGroupMin} teams in each.`;
  const squad = squadRulesProblem(draft);
  if (squad) errors.maxSquad = squad;
  return { ...errors, ...registrationErrors(draft) };
}

export function registrationErrors({ registrationOpens: opens, registrationDeadline: deadline, startDate }: Pick<TournamentDraft, 'registrationOpens' | 'registrationDeadline' | 'startDate'>): DraftErrors {
  if (opens && !isDateKey(opens)) return { registrationOpens: 'Choose a valid opening date.' };
  if (!deadline) return {};
  if (!isDateKey(deadline)) return { registrationDeadline: 'Choose a valid deadline.' };
  if (opens && deadline < opens) return { registrationDeadline: 'The deadline must be on or after registrations open.' };
  if (isDateKey(startDate) && deadline > startDate) return { registrationDeadline: 'Registrations must close by the start date.' };
  return {};
}
