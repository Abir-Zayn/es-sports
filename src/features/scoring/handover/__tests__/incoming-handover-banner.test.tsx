import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { minutesFromNow, offerFixture, renderWithClient } from '../__fixtures__/render';
import { IncomingHandoverBanner } from '../components/incoming-handover-banner';
import { fetchIncomingOffers, type IncomingOffer } from '../handover-repository';

const mockPush = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  // Runs on mount, as the real hook does when the screen is focused.
  useFocusEffect: (effect: () => void) => { jest.requireActual('react').useEffect(effect, [effect]); },
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'u-sam' } } }) }));
jest.mock('../handover-repository', () => ({ fetchIncomingOffers: jest.fn() }));

const incoming = jest.mocked(fetchIncomingOffers);
const offer = (over: Partial<IncomingOffer> = {}): IncomingOffer => ({
  ...offerFixture({ toUser: 'u-sam', fromUser: 'u-rafi' }), fromName: 'Rafi', teamA: 'Strikers', teamB: 'Tigers', ...over,
});

beforeEach(() => { jest.resetAllMocks(); mockPush.mockClear(); });

describe('the incoming handover banner on the Matches tab', () => {
  it('shows who asks, the two teams and the expiry, read for this account', async () => {
    incoming.mockResolvedValue([offer()]);
    await renderWithClient(<IncomingHandoverBanner />);
    expect(await screen.findByText('Rafi asks you to score')).toBeTruthy();
    expect(screen.getByText('Strikers vs Tigers · Expires in 10 min')).toBeTruthy();
    expect(incoming).toHaveBeenCalledWith('u-sam');
  });

  it('opens the request screen for that offer', async () => {
    incoming.mockResolvedValue([offer({ id: 'h7' })]);
    await renderWithClient(<IncomingHandoverBanner />);
    await fireEvent.press(await screen.findByRole('button', { name: 'View request' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/handover/[id]', params: { id: 'h7' } });
  });

  it('renders nothing when no offer is waiting, with no stray text', async () => {
    incoming.mockResolvedValue([]);
    const { toJSON } = await renderWithClient(<IncomingHandoverBanner />);
    await waitFor(() => expect(incoming).toHaveBeenCalled());
    expect(toJSON()).toBeNull();
  });

  it('hides an offer that has already expired, even if the server still lists it', async () => {
    incoming.mockResolvedValue([offer({ expiresAt: minutesFromNow(-2) })]);
    const { toJSON } = await renderWithClient(<IncomingHandoverBanner />);
    await waitFor(() => expect(incoming).toHaveBeenCalled());
    expect(screen.queryByText('Rafi asks you to score')).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('shows nothing when the read fails, and does not crash', async () => {
    incoming.mockRejectedValue(new Error('offline'));
    const { toJSON } = await renderWithClient(<IncomingHandoverBanner />);
    await waitFor(() => expect(incoming).toHaveBeenCalled());
    expect(toJSON()).toBeNull();
  });

  it('lists every waiting offer, each with its own button', async () => {
    incoming.mockResolvedValue([offer({ id: 'h1' }), offer({ id: 'h2', fromName: 'Imran', teamA: 'Kings', teamB: 'Lions' })]);
    await renderWithClient(<IncomingHandoverBanner />);
    expect(await screen.findByText('Imran asks you to score')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'View request' })).toHaveLength(2);
  });
});
