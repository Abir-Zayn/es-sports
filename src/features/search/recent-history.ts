import { useSyncExternalStore } from 'react';

const limit = 8;
let searches: string[] = [];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => searches;
const emit = () => listeners.forEach((listener) => listener());

export function saveSearch(value: string) {
  const query = value.trim();
  if (!query) return;
  searches = [query, ...searches.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, limit);
  emit();
}
export function clearSearches() {
  if (searches.length === 0) return;
  searches = [];
  emit();
}
export function useRecentSearches() { return useSyncExternalStore(subscribe, snapshot, snapshot); }
