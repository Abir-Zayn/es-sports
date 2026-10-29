import { useSyncExternalStore } from 'react';

import type { Performance, PlayerMatchPerformance } from '@/types/profile';

/** One player's part in a completed match, as the career ledger keeps it. */
export type LedgerLine = { profileId: string | null; performance: PlayerMatchPerformance; won: boolean; opponent: string };
export type LedgerMatch = { matchId: string; completedAt: string; lines: LedgerLine[] };

/**
 * Completed matches that count towards careers, kept on the device until a server stats feed exists. Recording
 * a match again replaces it, so a result that is undone and finished again is never counted twice.
 */
let matches: LedgerMatch[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function recordMatch(match: LedgerMatch): void {
  matches = [match, ...matches.filter((m) => m.matchId !== match.matchId)];
  emit();
}

/** Takes a match back out, e.g. when its final ball is undone. */
export function removeMatch(matchId: string): void {
  if (!matches.some((m) => m.matchId === matchId)) return;
  matches = matches.filter((m) => m.matchId !== matchId);
  emit();
}

export function resetLedger(): void {
  matches = [];
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const snapshot = () => matches;

const oversText = (balls: number) => `${Math.floor(balls / 6)}${balls % 6 ? `.${balls % 6}` : ''}`;
const shortDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** A ledger line as a row of the profile's recent performances. */
export function toRecent(match: LedgerMatch, line: LedgerLine): Performance {
  const p = line.performance;
  return {
    id: `${match.matchId}:${p.playerId}`, date: shortDate(match.completedAt), opponent: `vs ${line.opponent}`, won: line.won,
    bat: p.batted ? `${p.runs}${p.isNotOut ? '*' : ''} (${p.ballsFaced})` : undefined,
    bowl: p.ballsBowled > 0 ? `${p.wicketsTaken}/${p.runsConceded} (${oversText(p.ballsBowled)})` : undefined,
  };
}

/** The ledger entries of one account, newest first. */
export function careerOf(all: readonly LedgerMatch[], profileId: string): { performances: PlayerMatchPerformance[]; recent: Performance[] } {
  const performances: PlayerMatchPerformance[] = [];
  const recent: Performance[] = [];
  for (const match of all) {
    const line = match.lines.find((l) => l.profileId === profileId);
    if (!line) continue;
    performances.push(line.performance);
    recent.push(toRecent(match, line));
  }
  return { performances, recent };
}

/** Every completed match on this device, kept current. */
export function useLedger(): readonly LedgerMatch[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
