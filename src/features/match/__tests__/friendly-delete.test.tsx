import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { DeleteMatchSheet } from '../components/delete-match-sheet';
import { canDeleteSaved } from '../components/saved-friendlies';
import { deleteFriendlyMatch, DeleteFriendlyError, isDeleteConfirmed } from '../friendly/delete-friendly';

const mockRpc = jest.fn();
const mockList = jest.fn();
const mockRemove = jest.fn();
const mockDiscard = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args), storage: { from: () => ({ list: mockList, remove: mockRemove }) } },
}));
jest.mock('@/features/scoring/data/outboxes', () => ({ outboxes: { discard: (...args: unknown[]) => mockDiscard(...args) } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockList.mockResolvedValue({ data: [{ name: 'a' }, { name: 'b' }] });
  mockRemove.mockResolvedValue({ error: null });
});

describe('the confirmation word', () => {
  it.each([['DELETE', true], ['  delete ', true], ['Delet', false], ['', false], ['delete it', false]])('%j is %s', (typed, expected) => {
    expect(isDeleteConfirmed(typed)).toBe(expected);
  });
});

describe('deleteFriendlyMatch', () => {
  it('removes the match, forgets its unsent changes and clears its team images', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await deleteFriendlyMatch('m1', 'u1');
    expect(mockRpc).toHaveBeenCalledWith('delete_friendly_match', { p_match: 'm1' });
    expect(mockDiscard).toHaveBeenCalledWith('u1', 'm1');
    await Promise.resolve();
    expect(mockRemove).toHaveBeenCalledWith(['u1/friendly/m1/a', 'u1/friendly/m1/b']);
  });

  it.each([['42501', /only the person who created/i], ['ED001', /finished match/i], ['other', /could not delete/i]])(
    'says why a refusal (%s) happened and keeps the local copy', async (code, message) => {
      mockRpc.mockResolvedValue({ error: { code } });
      const failure = await deleteFriendlyMatch('m1', 'u1').catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(DeleteFriendlyError);
      expect((failure as Error).message).toMatch(message);
      expect(mockDiscard).not.toHaveBeenCalled();
    },
  );
});

describe('canDeleteSaved', () => {
  const match = { id: 'm', team_a_name: 'A', team_b_name: 'B', created_at: '2026-11-01', created_by: 'creator' };
  it('lets the creator delete and nobody else, a scorer included', () => {
    expect(canDeleteSaved(match, 'creator')).toBe(true);
    expect(canDeleteSaved(match, 'scorer')).toBe(false);
    expect(canDeleteSaved({ ...match, created_by: null }, 'creator')).toBe(false);
  });
});

describe('DeleteMatchSheet', () => {
  const setup = async (overrides: Partial<React.ComponentProps<typeof DeleteMatchSheet>> = {}) => {
    const onConfirm = jest.fn();
    await render(<ThemeProvider><DeleteMatchSheet visible label="Alpha vs Beta" busy={false} error={null} onConfirm={onConfirm} onClose={jest.fn()} {...overrides} /></ThemeProvider>);
    return onConfirm;
  };

  it('keeps Delete disabled until DELETE is typed', async () => {
    const onConfirm = await setup();
    expect(screen.getByText(/Alpha vs Beta will be deleted for good/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete match' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'delete');
    await fireEvent.press(screen.getByRole('button', { name: 'Delete match' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the reason a delete failed', async () => {
    await setup({ error: 'A finished match cannot be deleted.' });
    expect(screen.getByRole('alert')).toHaveTextContent('A finished match cannot be deleted.');
  });
});
