import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/theme';

import type { Handover } from '../types';

export const NOW = Date.now();
export const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

export const offerFixture = (over: Partial<Handover> = {}): Handover => ({
  id: 'h1', matchId: 'm1', fromUser: 'me', toUser: 'u-sam', initiatedBy: 'me', status: 'pending', expiresAt: minutesFromNow(10), ...over,
});

/** Renders with a fresh query client that does not retry, and returns it so a test can refetch on demand. */
export async function renderWithClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  const view = await render(
    <QueryClientProvider client={client}><ThemeProvider>{node}</ThemeProvider></QueryClientProvider>,
  );
  return { client, ...view };
}
