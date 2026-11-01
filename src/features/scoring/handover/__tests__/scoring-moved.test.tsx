import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { ScorerError } from '../../components/scorer-error';
import { OutboxConflictError, OutboxRejectedError } from '../../data/outbox-errors';
import { outboxes } from '../../data/outboxes';
import { offerFixture, renderWithClient } from '../__fixtures__/render';
import { fetchAcceptedHandover, fetchNames } from '../handover-repository';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('../../data/outboxes', () => ({ outboxes: { discard: jest.fn() } }));
jest.mock('../../data/match-repository', () => ({}));
jest.mock('../handover-repository', () => ({ fetchAcceptedHandover: jest.fn(), fetchNames: jest.fn() }));

const accepted = jest.mocked(fetchAcceptedHandover);
const notAllowed = (user = 'me') => new OutboxRejectedError(user, 'm1', 3, 'Save ball: You are not allowed to score this match (42501)', '42501');

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(fetchNames).mockResolvedValue({ 'u-sam': 'Sam' });
});

describe('the old scorer after a handover', () => {
  it('says "Scoring moved to <name>", why the unsent changes cannot be applied, and offers to discard them', async () => {
    accepted.mockResolvedValue(offerFixture({ status: 'accepted', fromUser: 'me', toUser: 'u-sam' }));
    const stopped = notAllowed();
    await renderWithClient(<ScorerError message={stopped.message} stopped={stopped} onRetry={jest.fn()} />);
    expect(await screen.findByText('Scoring moved to Sam.')).toBeTruthy();
    expect(screen.getByText(/3 changes on this phone cannot be applied, because Sam now scores from the score saved online/)).toBeTruthy();
    expect(accepted).toHaveBeenCalledWith('m1');
    expect(screen.getByRole('button', { name: 'Discard unsent changes' })).toBeTruthy();
  });

  it('never discards on its own: only the confirmed Discard button does', async () => {
    accepted.mockResolvedValue(offerFixture({ status: 'accepted', fromUser: 'me', toUser: 'u-sam' }));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onRetry = jest.fn();
    const stopped = notAllowed();
    await renderWithClient(<ScorerError message={stopped.message} stopped={stopped} onRetry={onRetry} />);
    await screen.findByText('Scoring moved to Sam.');
    expect(outboxes.discard).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Discard unsent changes' }));
    expect(outboxes.discard).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][1]).toContain('cannot be undone');
    alert.mock.calls[0][2]?.find((button) => button.text === 'Discard')?.onPress?.();
    expect(outboxes.discard).toHaveBeenCalledWith('me', 'm1');
    expect(onRetry).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('keeps the server message while the new scorer is still being looked up', async () => {
    accepted.mockReturnValue(new Promise(() => undefined));
    const stopped = notAllowed();
    await renderWithClient(<ScorerError message={stopped.message} stopped={stopped} onRetry={jest.fn()} />);
    expect(screen.getByText(stopped.message)).toBeTruthy();
    expect(screen.queryByText(/Scoring moved to/)).toBeNull();
  });

  it('keeps the server message when no handover of this account explains the refusal', async () => {
    accepted.mockResolvedValue(offerFixture({ status: 'accepted', fromUser: 'someone-else', toUser: 'u-sam' }));
    const stopped = notAllowed();
    await renderWithClient(<ScorerError message={stopped.message} stopped={stopped} onRetry={jest.fn()} />);
    await waitFor(() => expect(accepted).toHaveBeenCalled());
    // Give a wrongly started name lookup time to finish before checking that none ran.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(fetchNames).not.toHaveBeenCalled();
    expect(screen.getByText(stopped.message)).toBeTruthy();
    expect(screen.queryByText(/Scoring moved to/)).toBeNull();
  });

  it('keeps the server message when the lookup fails', async () => {
    accepted.mockRejectedValue(new Error('offline'));
    const stopped = notAllowed();
    await renderWithClient(<ScorerError message={stopped.message} stopped={stopped} onRetry={jest.fn()} />);
    await waitFor(() => expect(accepted).toHaveBeenCalled());
    expect(screen.getByText(stopped.message)).toBeTruthy();
  });

  it('does not look anything up for a refusal that is not "not allowed", or for a conflict', async () => {
    const other = new OutboxRejectedError('me', 'm1', 1, 'Save ball: malformed (22P02)', '22P02');
    await renderWithClient(<ScorerError message={other.message} stopped={other} onRetry={jest.fn()} />);
    expect(screen.getByText(other.message)).toBeTruthy();
    const conflict = new OutboxConflictError('me', 'm1', 2);
    await renderWithClient(<ScorerError message={conflict.message} stopped={conflict} onRetry={jest.fn()} />);
    expect(accepted).not.toHaveBeenCalled();
  });
});
