import { loadStoredLocale, parseLocale, saveStoredLocale } from './storage';
import { DEFAULT_LOCALE, type Locale } from './types';

let currentLocale: Locale = DEFAULT_LOCALE;
let hydrated = false;
let hydrationPromise: Promise<Locale> | null = null;
let writeSeq = 0;
let writeChain: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getLocale(): Locale {
  return currentLocale;
}

export function isLocaleHydrated(): boolean {
  return hydrated;
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Loads the persisted language once; ignores stale reads if the user changed language mid-boot. */
export function hydrateLocale(): Promise<Locale> {
  if (hydrated) return Promise.resolve(currentLocale);
  if (hydrationPromise) return hydrationPromise;
  const seqAtStart = writeSeq;
  hydrationPromise = loadStoredLocale()
    .then(
      (stored) => {
        if (writeSeq === seqAtStart) {
          currentLocale = stored;
        }
        hydrated = true;
        emit();
        return currentLocale;
      },
      () => {
        hydrated = true;
        emit();
        return currentLocale;
      },
    )
    .finally(() => {
      hydrationPromise = null;
    });
  return hydrationPromise;
}

/** Switches language immediately in memory and persists it sequentially to device storage. */
export function setLocale(next: Locale): void {
  const valid = parseLocale(next);
  const seq = ++writeSeq;
  const changed = valid !== currentLocale || !hydrated;
  currentLocale = valid;
  hydrated = true;
  if (changed) emit();
  writeChain = writeChain.then(() => {
    if (seq !== writeSeq) return undefined;
    return saveStoredLocale(valid);
  });
}

/** Resets in-memory locale state for unit tests. */
export function resetLocaleForTests(): void {
  writeSeq += 1;
  currentLocale = DEFAULT_LOCALE;
  hydrated = false;
  hydrationPromise = null;
  writeChain = Promise.resolve();
  emit();
}
