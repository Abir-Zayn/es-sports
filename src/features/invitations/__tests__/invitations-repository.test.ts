import { supabase } from '@/lib/supabase';

import {
  InvitationError,
  invitationErrorText,
  invitationMessage,
  toInvitationError,
} from '../invitation-errors';
import {
  acceptInvitation,
  cancelInvitation,
  declineInvitation,
  fetchInvitations,
  sendModeratorInvite,
  sendTeamOwnerInvite,
} from '../invitations-repository';
import { isOpen, type InvitationRow } from '../types';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn(), from: jest.fn() } }));

const rpc = jest.mocked(supabase.rpc) as unknown as jest.Mock;
const from = jest.mocked(supabase.from) as unknown as jest.Mock;
const NOW = Date.parse('2026-11-02T12:00:00Z');
const at = (minutes: number) => new Date(NOW + minutes * 60_000).toISOString();

function builder(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const step of ['select', 'eq', 'neq', 'in', 'order', 'limit']) {
    chain[step] = () => chain;
  }
  chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

const row = (over: Partial<InvitationRow> = {}): InvitationRow => ({
  id: 'inv-1',
  kind: 'team_owner',
  tournament_id: 't-1',
  team_id: 'team-1',
  from_user: 'u-1',
  to_user: 'u-2',
  status: 'pending',
  expires_at: at(60),
  created_at: at(-120),
  resolved_at: null,
  ...over,
});

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
});

describe('invitation rules and error mapping', () => {
  it('treats a pending invitation as open only while expiresAt > now', () => {
    expect(isOpen({ status: 'pending', expiresAt: at(5) }, NOW)).toBe(true);
    expect(isOpen({ status: 'pending', expiresAt: at(0) }, NOW)).toBe(false);
    expect(isOpen({ status: 'pending', expiresAt: at(-5) }, NOW)).toBe(false);
    expect(isOpen({ status: 'accepted', expiresAt: at(60) }, NOW)).toBe(false);
    expect(isOpen({ status: 'declined', expiresAt: at(60) }, NOW)).toBe(false);
    expect(isOpen({ status: 'cancelled', expiresAt: at(60) }, NOW)).toBe(false);
  });

  it.each([
    ['EI001', 'This invitation is no longer open.', true],
    ['EI002', 'An invitation is already pending for this person.', false],
    ['EI003', 'The sender no longer owns this team, so this invitation is no longer open.', true],
    ['42501', 'You are not allowed to do that.', false],
    ['22023', 'That person cannot be invited right now.', false],
  ] as const)('maps %s to a plain message and closed=%s', (code, expectedMessage, expectedClosed) => {
    const err = toInvitationError({ code, message: 'raw server error' });
    expect(err).toBeInstanceOf(InvitationError);
    expect(err.code).toBe(code);
    expect(err.closed).toBe(expectedClosed);
    expect(err.message).toBe(expectedMessage);
    expect(invitationErrorText(err)).toBe(expectedMessage);
    expect(invitationMessage({ code })).toBe(expectedMessage);
  });
});

describe('invitation RPC calls', () => {
  it('calls send_team_owner_invite, send_tournament_moderator_invite, accept, decline and cancel with contract args', async () => {
    rpc.mockResolvedValue({ data: 'inv-99', error: null });
    await expect(sendTeamOwnerInvite('t-1', 'team-1', 'u-2')).resolves.toBe('inv-99');
    expect(rpc).toHaveBeenLastCalledWith('send_team_owner_invite', {
      p_tournament: 't-1',
      p_team: 'team-1',
      p_to: 'u-2',
    });

    await expect(sendModeratorInvite('t-1', 'u-3')).resolves.toBe('inv-99');
    expect(rpc).toHaveBeenLastCalledWith('send_tournament_moderator_invite', {
      p_tournament: 't-1',
      p_to: 'u-3',
    });

    rpc.mockResolvedValue({ data: null, error: null });
    await acceptInvitation('inv-1');
    expect(rpc).toHaveBeenLastCalledWith('accept_invitation', { p_id: 'inv-1' });

    await declineInvitation('inv-1');
    expect(rpc).toHaveBeenLastCalledWith('decline_invitation', { p_id: 'inv-1' });

    await cancelInvitation('inv-1');
    expect(rpc).toHaveBeenLastCalledWith('cancel_invitation', { p_id: 'inv-1' });
  });

  it('throws InvitationError with closed=true on EI001 and EI003', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'EI001', message: 'not open' } });
    await expect(acceptInvitation('inv-1')).rejects.toMatchObject({
      code: 'EI001',
      closed: true,
      message: 'This invitation is no longer open.',
    });

    rpc.mockResolvedValueOnce({ data: null, error: { code: 'EI003', message: 'not owner' } });
    await expect(acceptInvitation('inv-1')).rejects.toMatchObject({
      code: 'EI003',
      closed: true,
      message: 'The sender no longer owns this team, so this invitation is no longer open.',
    });
  });
});

describe('fetchInvitations', () => {
  it('maps rows with tournament, team and sender names and marks expired pending rows as expired', async () => {
    from.mockImplementation((table: string) => {
      if (table === 'invitations') {
        return builder({
          data: [
            row({ id: 'inv-open', kind: 'team_owner', status: 'pending', expires_at: at(60) }),
            row({ id: 'inv-stale', kind: 'tournament_moderator', team_id: null, status: 'pending', expires_at: at(-5) }),
          ],
          error: null,
        });
      }
      if (table === 'tournaments') {
        return builder({ data: [{ id: 't-1', name: 'HSF Premier League 2026' }], error: null });
      }
      if (table === 'teams') {
        return builder({ data: [{ id: 'team-1', name: 'Bayazid Blasters' }], error: null });
      }
      if (table === 'profiles') {
        return builder({ data: [{ id: 'u-1', full_name: 'Arif Chowdhury' }], error: null });
      }
      return builder({ data: [], error: null });
    });

    const list = await fetchInvitations('u-2', NOW);
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      id: 'inv-open',
      kind: 'team-owner',
      tournamentName: 'HSF Premier League 2026',
      teamName: 'Bayazid Blasters',
      fromName: 'Arif Chowdhury',
      sentLabel: '2h ago',
      status: 'pending',
    });
    expect(list[1]).toMatchObject({
      id: 'inv-stale',
      kind: 'tournament-moderator',
      status: 'expired',
    });
  });
});

