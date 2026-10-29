import type { FriendlyMatchSetup, FriendlySide, FriendlyTossResult, TossCall, TossDecision } from '../types';
import { otherSide } from './friendly-rules';

/** A fair coin. `random` is injectable so tests can fix the outcome. */
export function flipCoin(random: () => number = Math.random): TossCall {
  return random() < 0.5 ? 'heads' : 'tails';
}

/** The caller wins when the coin lands the way they called it. */
export function tossWinner(calledBy: FriendlySide, call: TossCall, landed: TossCall): FriendlySide {
  return call === landed ? calledBy : otherSide(calledBy);
}

export function decideToss(
  flip: { calledBy: FriendlySide; call: TossCall; landed: TossCall }, decision: TossDecision, now: Date,
): FriendlyTossResult {
  return { ...flip, winner: tossWinner(flip.calledBy, flip.call, flip.landed), decision, tossedAt: now.toISOString() };
}

/** The side that bats first after the toss. */
export function battingFirstSide(toss: Pick<FriendlyTossResult, 'winner' | 'decision'>): FriendlySide {
  return toss.decision === 'bat' ? toss.winner : otherSide(toss.winner);
}

export const teamLabel = (setup: FriendlyMatchSetup, side: FriendlySide) =>
  setup[side].name.trim() || (side === 'teamA' ? 'Team A' : 'Team B');
