import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { ThemeProvider } from '@/theme';

import { EditMatchSheet } from '../components/edit-match-sheet';
import type { ScheduledMatch } from '../types';

jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: ReactNode }) => children }));

const team = (id: string, name: string) => ({ kind: 'team' as const, team: { id, name, short: id } });
const base: ScheduledMatch = {
  id: 'f5', number: 5, round: 0, stage: 'League', date: '2026-11-20', startMin: 34,
  home: team('CK', 'Chittagong Kings'), away: team('RL', 'Rajshahi Lions'),
};

const show = async (match: ScheduledMatch, extra: Partial<Parameters<typeof EditMatchSheet>[0]> = {}) => {
  const onSave = jest.fn().mockResolvedValue(null);
  const onCancelMatch = jest.fn().mockResolvedValue(null);
  await render(<ThemeProvider>
    <EditMatchSheet match={match} days={['2026-11-20', '2026-11-21']} onSave={onSave} onCancelMatch={onCancelMatch}
      continueScoring={<Text>Continue scoring</Text>} onClose={jest.fn()} {...extra} />
  </ThemeProvider>);
  return { onSave };
};

describe('editing a published match', () => {
  it('lets the owner move a match that was set up but is not over, and continue it, but not cancel it', async () => {
    const { onSave } = await show({ ...base, started: true });
    expect(screen.getByText('This match is set up and not over yet. You can still change its time.')).toBeTruthy();
    expect(screen.getByText('Continue scoring')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel this match' })).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Saturday 21 November' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('2026-11-21', 34);
  });

  it('locks a match that is over', async () => {
    await show({ ...base, started: true, finished: true });
    expect(screen.getByText('This match is over, so it can no longer change.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByText('Continue scoring')).toBeNull();
  });

  it('shows staff who cannot move it that it is set up, without the time controls', async () => {
    await show({ ...base, started: true }, { readOnly: true });
    expect(screen.getByText('This match is set up and not over yet.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });
});
