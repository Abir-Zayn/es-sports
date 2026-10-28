import { scorerReducer, type ScorerSession } from '../session-reducer';
import { rowToInput } from './event-rows';
import type { BallEventRow } from './types';

const need = (value: string | null, what: string): string => {
  if (!value) throw new Error(`A saved ${what} is missing a player.`);
  return value;
};

/**
 * Rebuilds a session by feeding the saved events through the same reducer that scored them, so the result
 * matches what the scorer saw, undo history included. Voided events were undone and are skipped.
 * A scoring shot with no saved direction is left pending only when it is the very last event; any earlier
 * one was skipped.
 */
export function replayEvents(base: ScorerSession, rows: BallEventRow[]): ScorerSession {
  const live = rows.filter((row) => !row.voided_at).sort((x, y) => x.seq - y.seq);
  let state = base;
  live.forEach((row, index) => {
    if (row.kind === 'innings_start') {
      state = scorerReducer(state, { type: 'setup', value: {
        ...state.setup, strikerId: need(row.striker_key, 'innings'),
        nonStrikerId: need(row.non_striker_key, 'innings'), bowlerId: need(row.bowler_key, 'innings'),
      } });
      state = scorerReducer(state, { type: 'start', id: row.id });
    } else if (row.kind === 'delivery') {
      state = scorerReducer(state, { type: 'delivery', input: rowToInput(row), id: row.id });
      const settled = row.angle !== null || index < live.length - 1;
      if (state.pendingShot && settled) {
        state = scorerReducer(state, { type: 'shot', angle: row.angle ?? undefined, id: `${row.id}:shot` });
      }
    } else if (row.kind === 'bowler') {
      state = scorerReducer(state, { type: 'bowler', playerId: need(row.bowler_key, 'bowler'), id: row.id });
    } else {
      state = scorerReducer(state, { type: 'swap', id: row.id });
    }
  });
  return state;
}
