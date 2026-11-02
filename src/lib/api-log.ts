/**
 * Development only: prints every server call to the Metro terminal, so you can follow a flow from the screen.
 *   [api] → players.search {"query":"loni","excluded":1}
 *   [api] ← players.search 42ms 3 rows
 *   [api] ✗ invite.sendTeamOwner 120ms code=EI003 You do not own this team
 * Pass only what helps you read the flow (ids, counts, names typed), never tokens or passwords.
 */
const enabled = () => typeof __DEV__ !== 'undefined' && __DEV__;

function summary(result: unknown): string {
  if (Array.isArray(result)) return `${result.length} rows`;
  if (result === null || result === undefined) return 'no data';
  if (typeof result === 'object') return 'ok';
  return String(result);
}

type Answer = { data?: unknown; error?: { code?: unknown; message?: unknown } | null };
const describeError = (error: { code?: unknown; message?: unknown }) => `code=${String(error.code ?? '-')} ${String(error.message ?? '')}`;

/** Runs `run`, logging the call, how long it took, a one-line summary of the answer, or the error code. Rethrows errors unchanged. */
export async function traceApi<T>(name: string, details: Record<string, unknown> | undefined, run: () => PromiseLike<T>): Promise<T> {
  if (!enabled()) return run();
  const started = Date.now();
  console.log(`[api] → ${name}`, details ? JSON.stringify(details) : '');
  try {
    const result = await run();
    // Supabase answers `{ data, error }` instead of throwing, so read both.
    const answer = (result ?? {}) as Answer;
    const took = `${Date.now() - started}ms`;
    if (answer.error) console.log(`[api] ✗ ${name} ${took} ${describeError(answer.error)}`);
    else console.log(`[api] ← ${name} ${took} ${summary('data' in answer ? answer.data : result)}`);
    return result;
  } catch (error) {
    console.log(`[api] ✗ ${name} ${Date.now() - started}ms ${describeError((error ?? {}) as { code?: unknown; message?: unknown })}`);
    throw error;
  }
}

/** A step inside a flow that is not a server call, e.g. which people a list left out and why. */
export function traceFlow(name: string, details?: Record<string, unknown>): void {
  if (enabled()) console.log(`[flow] ${name}`, details ? JSON.stringify(details) : '');
}
