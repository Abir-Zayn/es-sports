import { useEffect, useState } from 'react';

/** The current time, refreshed every `everyMs` (default 20 s) so a countdown keeps moving. */
export function useNow(everyMs = 20000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}
