import { searchPlayers } from '../search-players';

const mockRequest = {
  select: jest.fn(), ilike: jest.fn(), eq: jest.fn(), order: jest.fn(), limit: jest.fn(),
  not: jest.fn(), abortSignal: jest.fn(),
  then: (resolve: (value: unknown) => void) => Promise.resolve({
    data: [{ id: 'c40a0000-0000-4000-8000-000000000001', full_name: 'Arman Rahman', area: 'Agrabad', avatar_url: null }], error: null,
  }).then(resolve),
};
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn(() => mockRequest) } }));

beforeEach(() => {
  for (const fn of [mockRequest.select, mockRequest.ilike, mockRequest.order, mockRequest.limit, mockRequest.not, mockRequest.abortSignal]) {
    fn.mockReset().mockReturnValue(mockRequest);
  }
});

it('queries public profiles with excluded accounts and the cancellation signal', async () => {
  const id = 'c40a0000-0000-4000-8000-000000000002';
  const signal = new AbortController().signal;
  const players = await searchPlayers('  Arman  ', [id], signal);
  expect(mockRequest.select).toHaveBeenCalledWith('id, full_name, area, avatar_url');
  expect(mockRequest.ilike).toHaveBeenCalledWith('full_name', '%Arman%');
  expect(mockRequest.not).toHaveBeenCalledWith('id', 'in', `(${id})`);
  expect(mockRequest.limit).toHaveBeenCalledWith(20);
  expect(mockRequest.abortSignal).toHaveBeenCalledWith(signal);
  expect(players).toEqual([{ id: 'c40a0000-0000-4000-8000-000000000001', name: 'Arman Rahman', area: 'Agrabad', avatarUrl: null }]);
});

it('requires two characters and treats wildcard characters literally', async () => {
  expect(await searchPlayers('a', [])).toEqual([]);
  expect(mockRequest.select).not.toHaveBeenCalled();
  await searchPlayers('a_%', []);
  expect(mockRequest.ilike).toHaveBeenCalledWith('full_name', '%a\\_\\%%');
});

it('finds exactly one account when the text is a pasted user id', async () => {
  const id = 'C40A0000-0000-4000-8000-000000000001';
  mockRequest.eq = jest.fn().mockReturnValue(mockRequest);
  const players = await searchPlayers(`  ${id}  `, []);
  expect(mockRequest.eq).toHaveBeenCalledWith('id', id.toLowerCase());
  expect(mockRequest.ilike).not.toHaveBeenCalled();
  expect(players).toHaveLength(1);
});
