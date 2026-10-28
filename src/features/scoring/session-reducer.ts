import { createDemoScore } from './demo-score';
import { createInnings } from './engine/create-innings';
import { applyDelivery, chooseBowler, swapEnds } from './engine/score-delivery';
import { initialSetup } from './sample-data';
import type { Delivery, DeliveryInput, MatchSetup, OverlaySettings, ScoreState, ShotDraft } from './types';

/** One accepted state change. The match store saves these, so each carries what a saved row needs. */
export type AuditEvent =
  | { id: string; type: 'demo' }
  | { id: string; type: 'start'; innings: 1 | 2; strikerId: string; nonStrikerId: string; bowlerId: string }
  | { id: string; type: 'delivery'; deliveryId: string; innings: 1 | 2; nonStrikerId: string; delivery: Delivery }
  | { id: string; type: 'bowler'; innings: 1 | 2; playerId: string }
  | { id: string; type: 'swap'; innings: 1 | 2 }
  | { id: string; type: 'shot'; deliveryId?: string; angle?: number }
  | { id: string; type: 'undo'; deliveryId: string };

export type ScorerSession = {
  setup: MatchSetup;
  score: ScoreState | null;
  history: { score: ScoreState; deliveryId: string }[];
  audit: AuditEvent[];
  pendingShot: ShotDraft | null;
  overlay: OverlaySettings;
};
export const newSession = (): ScorerSession => ({
  setup: initialSetup, score: null, history: [], audit: [], pendingShot: null,
  overlay: { flashes: true, milestones: true, color: 'blue' },
});
export type ScorerAction =
  | { type: 'setup'; value: MatchSetup }
  | { type: 'start' | 'demo' | 'undo' | 'swap'; id: string }
  | { type: 'delivery'; input: DeliveryInput; id: string }
  | { type: 'bowler'; playerId: string; id: string }
  | { type: 'shot'; angle?: number; id: string }
  | { type: 'overlay'; value: OverlaySettings };

export function scorerReducer(state: ScorerSession, action: ScorerAction): ScorerSession {
  if (action.type === 'setup') return { ...state, setup: action.value };
  if (action.type === 'overlay') return { ...state, overlay: action.value };
  if (state.audit.some((event) => event.id === action.id)) return state;
  const log = (event: AuditEvent) => [...state.audit, event];
  if (action.type === 'demo') return { ...newSession(), score: createDemoScore(), audit: log({ id: action.id, type: 'demo' }) };
  if (action.type === 'start') {
    const score = createInnings(state.setup, state.score ?? undefined);
    return {
      ...state, score, history: [], pendingShot: null,
      audit: log({
        id: action.id, type: 'start', innings: score.innings,
        strikerId: score.strikerId, nonStrikerId: score.nonStrikerId, bowlerId: score.bowlerId,
      }),
    };
  }
  if (!state.score) return state;
  if (action.type === 'undo') {
    const previous = state.history.at(-1);
    if (!previous) return state;
    return {
      ...state, score: previous.score, pendingShot: null, history: state.history.slice(0, -1),
      audit: log({ id: action.id, type: 'undo', deliveryId: previous.deliveryId }),
    };
  }
  const innings = state.score.innings;
  if (action.type === 'bowler') return {
    ...state, score: chooseBowler(state.score, action.playerId),
    audit: log({ id: action.id, type: 'bowler', innings, playerId: action.playerId }),
  };
  if (action.type === 'swap') return {
    ...state, score: swapEnds(state.score), audit: log({ id: action.id, type: 'swap', innings }),
    history: [...state.history, { score: state.score, deliveryId: action.id }],
  };
  if (action.type === 'shot') {
    const update = (deliveries: ScoreState['currentOver']) => deliveries.map((d) =>
      d.id === state.pendingShot?.deliveryId ? { ...d, angle: action.angle } : d);
    return {
      ...state, pendingShot: null,
      audit: log({ id: action.id, type: 'shot', deliveryId: state.pendingShot?.deliveryId, angle: action.angle }),
      score: {
        ...state.score, currentOver: update(state.score.currentOver),
        lastOver: state.score.lastOver ? {
          ...state.score.lastOver, deliveries: update(state.score.lastOver.deliveries),
        } : null,
      },
    };
  }
  if (action.type !== 'delivery' || state.pendingShot) return state;
  const score = applyDelivery(state.score, action.input, action.id);
  if (score === state.score) return state;
  const delivery = [...score.currentOver, ...(score.lastOver?.deliveries ?? [])].find((d) => d.id === action.id)!;
  return {
    ...state, score,
    audit: log({
      id: action.id, type: 'delivery', deliveryId: action.id, innings,
      nonStrikerId: state.score.nonStrikerId, delivery,
    }),
    history: [...state.history, { score: state.score, deliveryId: action.id }],
    pendingShot: state.setup.recordShots && ['runs', 'no-ball'].includes(action.input.kind) && action.input.runs > 0 ? {
      deliveryId: action.id, runs: action.input.runs, batter: state.score.batters[state.score.strikerId].name,
      ball: delivery.ball,
    } : null,
  };
}
