import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { searchPlayers } from '@/features/match/friendly/search-players';

import { offerFixture, renderWithClient } from '../__fixtures__/render';
import { HandoverSection } from '../components/handover-section';
import {
  cancelHandover, fetchEndedHandover, fetchNames, fetchOpenHandover, offerHandover,
} from '../handover-repository';
import { handoverKeys } from '../use-handover';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/match/friendly/search-players', () => ({ searchPlayers: jest.fn() }));
jest.mock('../handover-repository', () => ({
  fetchOpenHandover: jest.fn(), fetchEndedHandover: jest.fn(), fetchNames: jest.fn(), offerHandover: jest.fn(), cancelHandover: jest.fn(),
}));

const open = jest.mocked(fetchOpenHandover);
const ended = jest.mocked(fetchEndedHandover);

const show = (props: Partial<React.ComponentProps<typeof HandoverSection>> = {}) =>
  renderWithClient(<HandoverSection matchId="m1" ready onLeave={jest.fn()} {...props} />);

beforeEach(() => {
  jest.resetAllMocks();
  open.mockResolvedValue(null);
  ended.mockResolvedValue(null);
  jest.mocked(fetchNames).mockResolvedValue({ 'u-sam': 'Sam' });
});

describe('the scorer handover section', () => {
  it('shows "Waiting for <name>", the expiry and Cancel while an offer is pending', async () => {
    open.mockResolvedValue(offerFixture());
    await show();
    expect(await screen.findByText('Waiting for Sam')).toBeTruthy();
    expect(screen.getByText('Expires in 10 min')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hand over scoring' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(cancelHandover).toHaveBeenCalledWith('h1');
  });

  it('offers "Hand over scoring", and holds it back until every ball has been sent', async () => {
    await show({ ready: false });
    const button = await screen.findByRole('button', { name: 'Hand over scoring' });
    expect(button.props.accessibilityState?.disabled ?? button.props['aria-disabled']).toBeTruthy();
    expect(screen.getByText('Hand over once every ball has been sent.')).toBeTruthy();
  });

  it('picks an app account, asks first, and only then sends the request', async () => {
    jest.mocked(searchPlayers).mockResolvedValue([{ id: 'u-sam', name: 'Sam', area: null, avatarUrl: null }]);
    jest.mocked(offerHandover).mockResolvedValue('h1');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Hand over scoring' }));
    await fireEvent.changeText(screen.getByPlaceholderText('Search players by name'), 'sa');
    await fireEvent.press(await screen.findByRole('button', { name: 'Hand over Sam' }, { timeout: 2000 }));
    expect(jest.mocked(searchPlayers).mock.calls[0].slice(0, 2)).toEqual(['sa', ['me']]);
    expect(offerHandover).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toBe('Hand scoring to Sam?');
    expect(alert.mock.calls[0][1]).toContain('15 minutes');
    await act(async () => { alert.mock.calls[0][2]?.find((b) => b.text === 'Send request')?.onPress?.(); });
    await waitFor(() => expect(offerHandover).toHaveBeenCalledWith('m1', 'u-sam'));
    alert.mockRestore();
  });

  it('says why a refused request failed, in plain words', async () => {
    jest.mocked(searchPlayers).mockResolvedValue([{ id: 'u-sam', name: 'Sam', area: null, avatarUrl: null }]);
    const { HandoverError } = jest.requireActual('../handover-errors');
    jest.mocked(offerHandover).mockRejectedValue(new HandoverError('Scoring is already being handed over. Cancel that request first.', 'ESH02', false));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Hand over scoring' }));
    await fireEvent.changeText(screen.getByPlaceholderText('Search players by name'), 'sa');
    await fireEvent.press(await screen.findByRole('button', { name: 'Hand over Sam' }, { timeout: 2000 }));
    await act(async () => { alert.mock.calls[0][2]?.find((b) => b.text === 'Send request')?.onPress?.(); });
    expect(await screen.findByText('Scoring is already being handed over. Cancel that request first.')).toBeTruthy();
    alert.mockRestore();
  });

  it.each([
    ['declined', 'Sam declined. You are still the scorer.'],
    ['expired', 'Your scoring request ran out of time. You are still the scorer.'],
    ['cancelled', 'Your scoring request was cancelled. You are still the scorer.'],
  ] as const)('clears the line and says the request was %s', async (status, text) => {
    open.mockResolvedValueOnce(offerFixture()).mockResolvedValue(null);
    ended.mockResolvedValue(offerFixture({ status }));
    const { client } = await show();
    expect(await screen.findByText('Waiting for Sam')).toBeTruthy();
    await act(async () => { await client.invalidateQueries({ queryKey: handoverKeys.open('m1') }); });
    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.queryByText('Waiting for Sam')).toBeNull();
    expect(screen.getByRole('button', { name: 'Hand over scoring' })).toBeTruthy();
  });

  it('tells the old scorer it moved, and offers to leave', async () => {
    const onLeave = jest.fn();
    open.mockResolvedValueOnce(offerFixture()).mockResolvedValue(null);
    ended.mockResolvedValue(offerFixture({ status: 'accepted' }));
    const { client } = await show({ onLeave });
    await screen.findByText('Waiting for Sam');
    await act(async () => { await client.invalidateQueries({ queryKey: handoverKeys.open('m1') }); });
    expect(await screen.findByText(/Sam accepted\. Scoring has moved to them/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Leave scoring' }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('shows no message when the scorer cancels their own request', async () => {
    open.mockResolvedValueOnce(offerFixture()).mockResolvedValue(null);
    jest.mocked(cancelHandover).mockResolvedValue(undefined);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('button', { name: 'Hand over scoring' })).toBeTruthy();
    expect(ended).not.toHaveBeenCalled();
    expect(screen.queryByText(/declined|ran out of time|was cancelled/)).toBeNull();
  });
});
