/** The match's score head is not the one this phone expected, so another device wrote to it first (ESC01). */
export class ScoringConflictError extends Error {
  constructor() {
    super('This match was changed on another device');
  }
}

const CONFLICT_CODE = 'ESC01';
// Event id stored under another match, void target not in this match, malformed row or missing operation id,
// not allowed to score. Repeating cannot fix any of them.
const FINAL_CODES = new Set(['23505', 'P0002', '22023', '22P02', '42501']);

export function errorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
}

export const isFinalCode = (error: unknown): boolean => FINAL_CODES.has(errorCode(error) ?? '');

/** The error a scoring function raised, with the stale-tail refusal turned into `ScoringConflictError`. */
export const scoringError = (error: unknown): unknown => (errorCode(error) === CONFLICT_CODE ? new ScoringConflictError() : error);
