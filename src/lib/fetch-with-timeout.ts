const REQUEST_TIMEOUT_MS = 20_000;

/** Bound Supabase requests without returning while a mutation is still running. */
export const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const source = init?.signal ?? (typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort();
  if (source?.aborted) controller.abort();
  else source?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    source?.removeEventListener('abort', abort);
  }
};
