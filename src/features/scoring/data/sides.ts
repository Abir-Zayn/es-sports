import type { TeamCode } from '../types';
import type { Side } from './types';

/** The scorer's two team codes, and the side each one is stored as. */
export const sideOf: Record<TeamCode, Side> = { KK: 'a', CS: 'b' };
export const teamOf = (side: Side): TeamCode => (side === 'a' ? 'KK' : 'CS');
