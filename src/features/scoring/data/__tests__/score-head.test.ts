import { fetchScoreHead } from '../match-repository';

const mockMaybeSingle = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => mockMaybeSingle() }) }) }) },
}));

const MATCH = '11111111-1111-4111-8111-111111111111';

describe('fetchScoreHead', () => {
  it('returns the stored head', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { score_head: 'b1' }, error: null });
    await expect(fetchScoreHead(MATCH)).resolves.toBe('b1');
  });

  it('returns no head for a match not on the server yet, such as one created offline', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(fetchScoreHead(MATCH)).resolves.toBeNull();
  });

  it('throws a server error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('timeout') });
    await expect(fetchScoreHead(MATCH)).rejects.toThrow('timeout');
  });
});
