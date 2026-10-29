import { z } from 'zod';

import { SQUAD_LIMITS, defaultSquadRules, sideFormats, squadRulesProblem } from './squad-formats';

export const competitionFormats = [
  { value: 'league-knockout', label: 'League + knockout', detail: 'A league stage, then the race to the final.' },
  { value: 'league', label: 'Round robin', detail: 'Every team plays every other team.' },
  { value: 'knockout', label: 'Single elimination', detail: 'A team is eliminated after one loss.' },
] as const;
export const matchFormats = ['T10', 'T20', 'ODI'] as const;
export const teamCounts = [4, 6, 8, 12, 16] as const;

export const draftSchema = z.object({
  version: z.literal(1),
  name: z.string().max(80),
  city: z.string().max(60),
  venue: z.string().max(80),
  startDate: z.string().max(10),
  endDate: z.string().max(10).default(''),
  coverUri: z.string().max(3_000_000).default(''),
  profileUri: z.string().max(3_000_000).default(''),
  matchFormat: z.enum(matchFormats),
  competition: z.enum(['league-knockout', 'league', 'knockout']),
  teams: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(12), z.literal(16)]),
  ball: z.enum(['Tennis', 'Leather']),
  sideFormat: z.enum(sideFormats).default('standard_11'),
  playersPerSide: z.number().int().min(SQUAD_LIMITS.sideMin).max(SQUAD_LIMITS.sideMax).default(defaultSquadRules.playersPerSide),
  minSquad: z.number().int().min(SQUAD_LIMITS.sideMin).max(SQUAD_LIMITS.squadMax).default(defaultSquadRules.minSquad),
  maxSquad: z.number().int().min(SQUAD_LIMITS.sideMin).max(SQUAD_LIMITS.squadMax).default(defaultSquadRules.maxSquad),
  /** Both optional: empty means open from now, and until the tournament starts. */
  registrationOpens: z.string().max(10).default(''),
  registrationDeadline: z.string().max(10).default(''),
});
export type TournamentDraft = z.infer<typeof draftSchema>;
export type DraftErrors = Partial<Record<keyof TournamentDraft, string>>;
export const emptyDraft: TournamentDraft = {
  version: 1, name: '', city: '', venue: '', startDate: '', endDate: '', coverUri: '', profileUri: '',
  matchFormat: 'T20', competition: 'league-knockout', teams: 8, ball: 'Tennis',
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
  if (draft.competition === 'knockout' && ![4, 8, 16].includes(draft.teams)) {
    errors.teams = 'Choose 4, 8, or 16 teams for a knockout tournament.';
  }
  const squad = squadRulesProblem(draft);
  if (squad) errors.maxSquad = squad;
  return { ...errors, ...registrationErrors(draft) };
}

function registrationErrors({ registrationOpens: opens, registrationDeadline: deadline, startDate }: TournamentDraft): DraftErrors {
  if (opens && !isDateKey(opens)) return { registrationOpens: 'Choose a valid opening date.' };
  if (!deadline) return {};
  if (!isDateKey(deadline)) return { registrationDeadline: 'Choose a valid deadline.' };
  if (opens && deadline < opens) return { registrationDeadline: 'The deadline must be on or after registrations open.' };
  if (isDateKey(startDate) && deadline > startDate) return { registrationDeadline: 'Registrations must close by the start date.' };
  return {};
}
