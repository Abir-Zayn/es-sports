import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import type { EnteredTeam, TournamentRecord } from '../../data/tournament-repository';
import { drawRound } from '../../data/rounds-repository';
import { emptyDraft } from '../../create/draft';
import { resetSchedules } from '../schedule-repository';
import { ScheduleBuilder } from '../schedule-builder';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/team', () => ({ useOpenTeam: () => jest.fn() }));
jest.mock('../../data/rounds-repository', () => ({
  ...jest.requireActual('../../data/rounds-repository'), drawRound: jest.fn().mockResolvedValue(undefined),
}));

it('allows the owner to draw groups directly from the schedule', async () => {
  resetSchedules();
  const teams = Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, name: `Team ${i}`, short: `T${i}` }));
  const entered: EnteredTeam[] = teams.map((team) => ({ team: { ...team, shortName: team.short, tone: 'neutral', logoUrl: null, area: null, district: null }, owner: null, eliminated: false, group: null }));
  const tournament = { id: 'draft:groups', teamsPlanned: 6 } as TournamentRecord;
  const round = { round: 0, kind: 'groups' as const, groups: 2, advance: null, teamIds: teams.map((team) => team.id), groupOf: new Map<string, number>(), slots: [] };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}>
    <ScheduleBuilder tournamentId="draft:groups" setup={{ ...emptyDraft, startDate: '2026-11-20', endDate: '2026-11-25', plan: { round: 0, kind: 'groups', groupIds: null, slots: [] } }}
      days={['2026-11-20']} teams={teams} isOwner bottomInset={0} groups={{ tournament, teams: entered, round }} />
  </QueryClientProvider></ThemeProvider>);
  await fireEvent.press(await screen.findByRole('button', { name: 'Draw groups' }));
  await waitFor(() => expect(drawRound).toHaveBeenCalledWith('draft:groups', 0, 2));
});
