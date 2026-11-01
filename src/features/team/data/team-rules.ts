import type { AvatarTone } from '@/theme';

export const teamTones: readonly AvatarTone[] = ['blue', 'yellow', 'neutral'];

export type NewTeamInput = { name: string; shortName: string; tone: AvatarTone; area: string };

const NAME = { min: 2, max: 40 };
const SHORT_NAME = /^[A-Z0-9]{2,4}$/;
const AREA_MAX = 60;

/** "Chattogram Strikers" suggests "CS"; a one-word name gives its first three letters. */
export function suggestShortName(name: string): string {
  const words = name.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 3);
  return words.map((word) => word[0]).join('').slice(0, 4);
}

export const cleanShortName = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

/** Why these details cannot make a team, or null. The server applies the same checks. */
export function teamProblem({ name, shortName, area }: NewTeamInput): string | null {
  const trimmed = name.trim();
  if (trimmed.length < NAME.min || trimmed.length > NAME.max) return `Enter a team name of ${NAME.min} to ${NAME.max} characters.`;
  if (!SHORT_NAME.test(shortName)) return 'Short name is 2 to 4 letters or digits, e.g. CS.';
  if (area.trim().length > AREA_MAX) return `Area can be at most ${AREA_MAX} characters.`;
  return null;
}
