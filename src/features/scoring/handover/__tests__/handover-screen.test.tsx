import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { useLiveMatchData } from '@/features/match/use-live-match-data';

import { minutesFromNow, offerFixture, renderWithClient } from '../__fixtures__/render';
import { HandoverError } from '../handover-errors';
import { acceptHandover, declineHandover, fetchIncomingOffers, type IncomingOffer } from '../handover-repository';
import { HandoverScreen } from '../handover-screen';

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ id: 'h1' }) }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'u-sam' } } }) }));
jest.mock('@/features/match/use-live-match-data', () => ({ useLiveMatchData: jest.fn() }));
jest.mock('../handover-repository', () => ({ fetchIncomingOffers: jest.fn(), acceptHandover: jest.fn(), declineHandover: jest.fn() }));

const offer = (over: Partial<IncomingOffer> = {}): IncomingOffer => ({
  ...offerFixture({ toUser: 'u-sam', fromUser: 'u-rafi', matchId: 'm1' }), fromName: 'Rafi', teamA: 'Strikers', teamB: 'Tigers', ...over,
});
const team = (name: string) => ({ short: name.slice(0, 3).toUpperCase(), name, tone: 'primary' as const });
const score = { data: { sides: [{ team: team('Strikers'), score: '84/3', overs: '(10.2)' }, { team: team('Tigers'), score: 'Yet to bat', overs: '' }] }, isError: false };

beforeEach(() => {
  jest.resetAllMocks();
  mockRouter.canGoBack.mockReturnValue(true);
  jest.mocked(useLiveMatchData).mockReturnValue(score as unknown as ReturnType<typeof useLiveMatchData>);
});

describe('the scoring request screen', () => {
  it('shows who asks, the two teams, the score so far and the expiry', async () => {
    jest.mocked(fetchIncomingOffers).mockResolvedValue([offer()]);
    await renderWithClient(<HandoverScreen />);
    expect(await screen.findByText('Rafi asks you to take over scoring.')).toBeTruthy();
    expect(screen.getByText('Strikers vs Tigers')).toBeTruthy();
    expect(screen.getByText('Strikers  84/3 (10.2)')).toBeTruthy();
    expect(screen.getByText('Tigers  Yet to bat')).toBeTruthy();
    expect(screen.getByText('Expires in 10 min')).toBeTruthy();
  });

  it('accepts, then opens the scorer for that match', async () => {
    jest.mocked(fetchIncomingOffers).mockResolvedValue([offer()]);
    jest.mocked(acceptHandover).mockResolvedValue(undefined);
    await renderWithClient(<HandoverScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Accept and start scoring' }));
    await waitFor(() => expect(acceptHandover).toHaveBeenCalledWith('h1', 'Rafi'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/scorer/[id]', params: { id: 'm1' } }));
  });

  it('declines and goes back without opening the scorer', async () => {
    jest.mocked(fetchIncomingOffers).mockResolvedValue([offer()]);
    jest.mocked(declineHandover).mockResolvedValue(undefined);
    await renderWithClient(<HandoverScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Decline' }));
    await waitFor(() => expect(declineHandover).toHaveBeenCalledWith('h1'));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('shows a refused accept in plain words and stays', async () => {
    jest.mocked(fetchIncomingOffers).mockResolvedValueOnce([offer()]).mockResolvedValue([]);
    jest.mocked(acceptHandover).mockRejectedValue(new HandoverError('The scorer changed, so this request is no longer open.', 'ESH03', true));
    await renderWithClient(<HandoverScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Accept and start scoring' }));
    expect(await screen.findByText('The scorer changed, so this request is no longer open.')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it.each([
    ['gone from the list', [] as IncomingOffer[]],
    ['past its expiry', [offer({ expiresAt: minutesFromNow(-1) })]],
  ])('says the request is no longer open when it is %s', async (_label, list) => {
    jest.mocked(fetchIncomingOffers).mockResolvedValue(list);
    await renderWithClient(<HandoverScreen />);
    expect(await screen.findByText('This scoring request is no longer open.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Accept and start scoring' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Back to matches' }));
    expect(mockRouter.replace).toHaveBeenCalledWith('/matches');
  });

  it('offers a retry when the request cannot be loaded', async () => {
    jest.mocked(fetchIncomingOffers).mockRejectedValue(new Error('offline'));
    await renderWithClient(<HandoverScreen />);
    expect(await screen.findByText('Could not load this request.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('still lets the person decide while the score is loading or failed', async () => {
    jest.mocked(fetchIncomingOffers).mockResolvedValue([offer()]);
    jest.mocked(useLiveMatchData).mockReturnValue({ data: undefined, isError: true } as unknown as ReturnType<typeof useLiveMatchData>);
    await renderWithClient(<HandoverScreen />);
    expect(await screen.findByText('The score could not be loaded.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Accept and start scoring' })).toBeTruthy();
  });
});
