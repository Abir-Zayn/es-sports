import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithClient } from '../__fixtures__/render';
import { ResumeScoringAction } from '../components/resume-scoring-action';
import { canScoreMatch } from '@/features/scoring/data/match-repository';

const mockPush = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/scoring/data/match-repository', () => ({ canScoreMatch: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('"Continue scoring" on a live match', () => {
  it('lets the assigned scorer back into the scorer after leaving it', async () => {
    jest.mocked(canScoreMatch).mockResolvedValue(true);
    await renderWithClient(<ResumeScoringAction matchId="m1" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Continue scoring' }));
    expect(canScoreMatch).toHaveBeenCalledWith('m1');
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/scorer/[id]', params: { id: 'm1' } });
  });

  it('stays hidden for anyone the server does not let score', async () => {
    jest.mocked(canScoreMatch).mockResolvedValue(false);
    const { toJSON } = await renderWithClient(<ResumeScoringAction matchId="m1" />);
    await waitFor(() => expect(canScoreMatch).toHaveBeenCalled());
    expect(toJSON()).toBeNull();
  });
});
