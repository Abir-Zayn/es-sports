import { fetchProfile } from '../profile-repository';

const mockUpsert = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    })),
  },
}));

describe('fetchProfile with no profile row yet', () => {
  beforeEach(() => mockUpsert.mockReset().mockResolvedValue({ error: null }));

  it('names an email sign-up after the email, so player search can find them', async () => {
    const stored = await fetchProfile({ id: 'u1', email: 'testuser002@gmail.com', user_metadata: {} });
    expect(stored.fullName).toBe('testuser002');
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1', full_name: 'testuser002' }), expect.anything());
  });

  it('prefers the sign-in provider name over the email', async () => {
    const stored = await fetchProfile({ id: 'u2', email: 'x@gmail.com', user_metadata: { full_name: 'Rafi Ahmed' } });
    expect(stored.fullName).toBe('Rafi Ahmed');
  });
});
