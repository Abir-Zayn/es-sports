import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { ThemeProvider } from '@/theme';

import { ScorerError } from '../components/scorer-error';
import { OutboxConflictError, OutboxRejectedError } from '../data/outbox-errors';
import { outboxes } from '../data/outboxes';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('../data/outboxes', () => ({ outboxes: { discard: jest.fn() } }));
jest.mock('../data/match-repository', () => ({}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const show = (node: React.ReactElement) => render(<ThemeProvider>{node}</ThemeProvider>);

describe('the scorer error screen', () => {
  beforeEach(() => jest.mocked(outboxes.discard).mockClear());

  it.each([
    ['a conflict', new OutboxConflictError('user-1', 'match-1', 2)],
    ['a change the server refused for good', new OutboxRejectedError('user-1', 'match-1', 2, 'Save ball: not allowed (42501)')],
  ])('offers to discard the unsent changes after %s, and asks first', async (_label, stopped) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onRetry = jest.fn();
    await show(<ScorerError message={stopped.message} stopped={stopped} onRetry={onRetry} />);
    expect(screen.getByText(stopped.message)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Discard unsent changes' }));
    expect(outboxes.discard).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2] ?? [];
    expect(alert.mock.calls[0][1]).toContain('cannot be undone');
    buttons.find((button) => button.text === 'Discard')?.onPress?.();
    expect(outboxes.discard).toHaveBeenCalledWith('user-1', 'match-1');
    expect(onRetry).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('offers only a retry for an error with nothing to discard', async () => {
    await show(<ScorerError message="Could not open the match." onRetry={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Discard unsent changes' })).toBeNull();
  });
});
