import { createContext, useCallback, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/theme';

import { ScorerError } from './components/scorer-error';
import { loadScorer, type LoadedScorer } from './data/load-scorer';
import { OutboxConflictError } from './data/outbox';
import { localEventId } from './local-id';
import { scorerReducer, type ScorerAction, type ScorerSession } from './session-reducer';
import { useCareerRollup } from './use-career-rollup';
import { useMatchSync, type SyncInfo } from './use-match-sync';

export { localEventId };

/** `matchId` is the route id; `savedId` is the id the match is stored under. */
type ScorerContextValue = ScorerSession & { dispatch: Dispatch<ScorerAction>; matchId: string; savedId: string; sync: SyncInfo };
const ScorerContext = createContext<ScorerContextValue | null>(null);

type Settled = { phase: 'error'; message: string; conflict?: OutboxConflictError } | { phase: 'ready'; loaded: LoadedScorer };

/** Opens the stored match for this route (or a fresh one), then hands it to the scoring session. */
export function ScorerProvider({ matchId, children }: { matchId: string; children: ReactNode }) {
  const userId = useAuth().session?.user.id;
  const { colors } = useTheme();
  const [attempt, setAttempt] = useState(0);
  // A result only counts for the request it answers, so a new route, user or retry shows loading again.
  const requestKey = `${matchId}|${userId ?? ''}|${attempt}`;
  const [answer, setAnswer] = useState<{ key: string; settled: Settled } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    loadScorer(matchId, userId).then(
      (loaded) => { if (current) setAnswer({ key: requestKey, settled: { phase: 'ready', loaded } }); },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Could not open the match.';
        const conflict = error instanceof OutboxConflictError ? error : undefined;
        if (current) setAnswer({ key: requestKey, settled: { phase: 'error', message, conflict } });
      },
    );
    return () => { current = false; };
  }, [matchId, userId, requestKey]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const settled: Settled | null = !userId ? { phase: 'error', message: 'Sign in to score a match.' }
    : answer?.key === requestKey ? answer.settled : null;
  if (settled?.phase === 'ready') {
    return <ScorerSessionProvider routeId={matchId} loaded={settled.loaded} onReload={retry}>{children}</ScorerSessionProvider>;
  }
  if (settled?.phase === 'error') return <ScorerError message={settled.message} conflict={settled.conflict} onRetry={retry} />;
  return <View style={[styles.loading, { backgroundColor: colors.background }]}>
    <ActivityIndicator accessibilityLabel="Opening match" color={colors.primary} />
  </View>;
}

function ScorerSessionProvider({ routeId, loaded, onReload, children }: { routeId: string; loaded: LoadedScorer; onReload: () => void; children: ReactNode }) {
  const [session, dispatch] = useReducer(scorerReducer, loaded.session);
  const sync = useMatchSync({ session, userId: loaded.userId, matchId: loaded.matchId, fixtureRef: loaded.fixtureRef, saved: loaded.saved });
  useCareerRollup(session, loaded.matchId);
  // Another device scored this match: block every scoring screen until the person chooses.
  if (sync.conflict) return <ScorerError message={sync.conflict.message} conflict={sync.conflict} onRetry={onReload} />;
  return <ScorerContext value={{ ...session, dispatch, matchId: routeId, savedId: loaded.matchId, sync }}>{children}</ScorerContext>;
}

export function useScorer() {
  const value = useContext(ScorerContext);
  if (!value) throw new Error('Scorer screens must be inside ScorerProvider.');
  return value;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
