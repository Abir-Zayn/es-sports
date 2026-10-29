import { newSession, scorerReducer, type ScorerSession } from '../../session-reducer';

const begin = () => scorerReducer(newSession(), { type: 'start', id: 'start' });
const record = (state: ScorerSession, runs = 4, id = 'delivery') =>
  scorerReducer(state, { type: 'delivery', input: { kind: 'runs', runs }, id });

describe('scorer session', () => {
  it('undoes a delivery and keeps an audit reference', () => {
    const initial = begin();
    const scored = record(initial);
    const undone = scorerReducer(scored, { type: 'undo', id: 'undo' });
    expect(undone.score).toEqual(initial.score);
    expect(undone.pendingShot).toBeNull();
    expect(undone.history).toHaveLength(0);
    expect(undone.audit.at(-1)).toEqual({ id: 'undo', type: 'undo', deliveryId: 'delivery' });
  });

  it('prevents duplicate delivery IDs from counting twice', () => {
    const first = record(begin(), 0);
    expect(record(first, 0)).toBe(first);
  });

  it('waits for a shot to be saved or skipped before accepting another delivery', () => {
    const state = record(begin());
    expect(state.pendingShot?.runs).toBe(4);
    expect(record(state, 1, 'blocked')).toBe(state);
    const saved = scorerReducer(state, { type: 'shot', angle: -15, id: 'save' });
    expect(saved.pendingShot).toBeNull();
    expect(saved.score?.currentOver[0].angle).toBe(-15);
    expect(record(saved, 1, 'next').score?.runs).toBe(5);
  });

  it('skipping a shot retains the scored runs', () => {
    const skipped = scorerReducer(record(begin()), { type: 'shot', id: 'skip' });
    expect(skipped.score?.runs).toBe(4);
    expect(skipped.pendingShot).toBeNull();
  });

  it('stores the last-ball direction on the completed over and can undo it', () => {
    let state = begin();
    for (let i = 0; i < 5; i++) state = record(state, 0, `dot-${i}`);
    state = record(state, 4, 'last-ball');
    state = scorerReducer(state, { type: 'shot', angle: 25, id: 'save' });
    expect(state.score?.lastOver?.deliveries.at(-1)?.angle).toBe(25);
    state = scorerReducer(state, { type: 'bowler', playerId: 'CS-7', id: 'bowler' });
    state = scorerReducer(state, { type: 'undo', id: 'undo' });
    expect(state.score?.balls).toBe(5);
    expect(state.score?.bowlerId).toBe('CS-10');
    expect(state.score?.runs).toBe(0);
    expect(state.score?.lastOver).toBeNull();
  });

  it('undoes a manual strike correction', () => {
    const state = begin();
    const swapped = scorerReducer(state, { type: 'swap', id: 'swap' });
    expect(swapped.score?.strikerId).toBe(state.score?.nonStrikerId);
    expect(scorerReducer(swapped, { type: 'undo', id: 'undo' }).score).toEqual(state.score);
  });
});

describe('shot records', () => {
  it('keeps each saved shot direction for the wagon wheel, and nothing for a skipped one', () => {
    const saved = scorerReducer(record(begin()), { type: 'shot', angle: 270, id: 'save' });
    expect(saved.score?.shots).toEqual([{ batterId: 'KK-0', runs: 4, angle: 270 }]);
    const skipped = scorerReducer(record(saved, 2, 'two'), { type: 'shot', id: 'skip' });
    expect(skipped.score?.shots).toHaveLength(1);
  });
});
