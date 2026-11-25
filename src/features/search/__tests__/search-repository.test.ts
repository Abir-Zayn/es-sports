import { supabase } from '@/lib/supabase';

import { searchTournaments } from '../search-repository';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const chain = (rows: unknown[]) => {
  const q: Record<string, jest.Mock> = {};
  for (const name of ['select', 'is', 'ilike', 'order', 'limit']) q[name] = jest.fn(() => q);
  q.abortSignal = jest.fn(async () => ({ data: rows, error: null }));
  return q;
};

describe('tournament search', () => {
  it('matches the name as plain text, leaving deleted tournaments out', async () => {
    const q = chain([{ id: 't1', name: 'Halishahar Cup', city: null, profile_url: null }]);
    jest.mocked(supabase.from).mockReturnValue(q as never);
    await expect(searchTournaments(' Hali%sha_r ', new AbortController().signal)).resolves.toHaveLength(1);
    expect(q.is).toHaveBeenCalledWith('deleted_at', null);
    expect(q.ilike).toHaveBeenCalledWith('name', '%Hali sha r%');
  });

  it('does not ask the server when only filter characters were typed', async () => {
    jest.mocked(supabase.from).mockClear();
    await expect(searchTournaments('%_*', new AbortController().signal)).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
