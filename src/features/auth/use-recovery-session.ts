import { useEffect, useRef, useState } from 'react';

import { INVALID_RECOVERY_LINK, openRecoverySession } from './password-recovery';

type State = { status: 'checking' } | { status: 'ready'; userId: string }
  | { status: 'error'; message: string; retryable: boolean };

export function useRecoverySession(fragment: string | undefined) {
  const [input, setInput] = useState({ fragment, revision: 0 });
  const [result, setResult] = useState<{ input: typeof input; state: State } | null>(null);
  const pending = useRef<{ input: typeof input; result: ReturnType<typeof openRecoverySession> } | null>(null);
  // Retain the credentials privately when the router clears the public fragment.
  if (fragment && fragment !== input.fragment) setInput({ fragment, revision: input.revision + 1 });
  const state: State = result?.input === input ? result.state : input.fragment
    ? { status: 'checking' } : { status: 'error', message: INVALID_RECOVERY_LINK, retryable: false };

  useEffect(() => {
    let active = true;
    const current = input.fragment;
    if (!current) return;
    if (pending.current?.input !== input) {
      // Cache the operation across Strict Mode effect replays.
      pending.current = { input, result: openRecoverySession(current) };
    }
    void pending.current.result.then((result) => {
      if (!active) return;
      setResult({ input, state: result.ok ? { status: 'ready', userId: result.userId }
        : { status: 'error', message: result.message, retryable: result.retryable } });
    });
    return () => { active = false; };
  }, [input]);

  return { state, revision: input.revision, retry: () => setInput((value) => ({ ...value, revision: value.revision + 1 })) };
}
