import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { minutesFromNow, renderWithClient } from '../__fixtures__/render';
import { TakeoverAction } from '../components/takeover-action';
import { HandoverError } from '../handover-errors';
import { fetchNames, fetchTakeoverFacts, takeOverScoring } from '../handover-repository';
import type { TakeoverFacts } from '../types';

const mockPush = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('../handover-repository', () => ({ fetchTakeoverFacts: jest.fn(), fetchNames: jest.fn(), takeOverScoring: jest.fn() }));

const facts = (over: Partial<TakeoverFacts> = {}): TakeoverFacts => ({
  creatorId: 'me', scorerId: 'u-rafi', status: 'live', friendly: true, lastBallAt: minutesFromNow(-20), ...over,
});
const show = () => renderWithClient(<TakeoverAction matchId="m1" />);

beforeEach(() => {
  jest.resetAllMocks();
  mockPush.mockClear();
  jest.mocked(fetchNames).mockResolvedValue({ 'u-rafi': 'Rafi' });
});

describe('"Take over scoring" for the creator', () => {
  it('shows when the match is live and the scorer has been idle for 15 minutes', async () => {
    jest.mocked(fetchTakeoverFacts).mockResolvedValue(facts());
    await show();
    expect(await screen.findByRole('button', { name: 'Take over scoring' })).toBeTruthy();
  });

  it.each([
    ['the scorer scored a minute ago', facts({ lastBallAt: minutesFromNow(-1) })],
    ['the match is finished', facts({ status: 'completed' })],
    ['someone else created the match', facts({ creatorId: 'other' })],
    ['the creator already scores', facts({ scorerId: 'me' })],
  ])('is hidden when %s', async (_label, value) => {
    jest.mocked(fetchTakeoverFacts).mockResolvedValue(value);
    const { toJSON } = await show();
    await waitFor(() => expect(fetchTakeoverFacts).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Take over scoring' })).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('asks first, then takes over and opens the scorer', async () => {
    jest.mocked(fetchTakeoverFacts).mockResolvedValue(facts());
    jest.mocked(takeOverScoring).mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Take over scoring' }));
    expect(takeOverScoring).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][1]).toContain('Rafi has not scored for 15 minutes');
    await act(async () => { alert.mock.calls[0][2]?.find((button) => button.text === 'Take over')?.onPress?.(); });
    await waitFor(() => expect(takeOverScoring).toHaveBeenCalledWith('m1', 'me', 'Rafi'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/scorer/[id]', params: { id: 'm1' } }));
    alert.mockRestore();
  });

  it('shows the server\'s refusal as "<name> scored a moment ago" and keeps it when the button goes away', async () => {
    const refusal = new HandoverError('Rafi scored a moment ago. Try again after 15 minutes without a ball.', 'ESH04', false);
    jest.mocked(fetchTakeoverFacts).mockResolvedValueOnce(facts()).mockResolvedValue(facts({ lastBallAt: minutesFromNow(0) }));
    jest.mocked(takeOverScoring).mockRejectedValue(refusal);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Take over scoring' }));
    await act(async () => { alert.mock.calls[0][2]?.find((button) => button.text === 'Take over')?.onPress?.(); });
    expect(await screen.findByText(/^Rafi scored a moment ago/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Take over scoring' })).toBeNull());
    expect(screen.getByText(/^Rafi scored a moment ago/)).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
