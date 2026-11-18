import { focusManager } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { useHasSeenReleaseNotes, useReleaseNotes } from './use-whats-new';

const subscribeToAppFocus = (listener: () => void) => focusManager.subscribe(listener);
const isAppFocused = () => focusManager.isFocused();

export function AutoOpenWhatsNew() {
  const pathname = usePathname();
  const focused = useSyncExternalStore(subscribeToAppFocus, isAppFocused, isAppFocused);
  const opened = useRef(false);
  const seen = useHasSeenReleaseNotes();
  const shouldOpen = pathname === '/home' && focused && seen.data === false;
  const notes = useReleaseNotes(shouldOpen);

  useEffect(() => {
    if (!shouldOpen || !notes.data || opened.current) return;
    opened.current = true;
    router.navigate('/whats-new');
  }, [notes.data, shouldOpen]);

  return null;
}
