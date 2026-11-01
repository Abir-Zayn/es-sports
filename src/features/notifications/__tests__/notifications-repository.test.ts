import { supabase } from '@/lib/supabase';

import { watchNotifications } from '../notifications-channel';
import { fetchNotifications, markNotificationsRead } from '../notifications-repository';
import type { NotificationRow } from '../types';

const mockRemoveChannel = jest.fn();
const mockSubscribe = jest.fn();
const mockOn = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

const rpc = jest.mocked(supabase.rpc) as unknown as jest.Mock;
const from = jest.mocked(supabase.from) as unknown as jest.Mock;
const channel = jest.mocked(supabase.channel) as unknown as jest.Mock;
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

const row = (over: Partial<NotificationRow> = {}): NotificationRow => ({
  id: 'n-1',
  user_id: 'u-1',
  kind: 'invite',
  title: 'Team ownership invitation',
  message: 'You were invited to take ownership of a team.',
  data: { invitation_id: 'inv-1', tournament_id: 't-1', team_id: 'team-1', status: 'pending' },
  read_at: null,
  created_at: at(-20),
  ...over,
});

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
  channel.mockReset();
  mockRemoveChannel.mockReset();
  mockSubscribe.mockReset();
  mockOn.mockReset();
});

describe('notifications repository', () => {
  it('maps invite and invite_response notifications and reconciles cancelled/expired invitations', async () => {
    from.mockImplementation((table: string) => {
      if (table === 'notifications') {
        return builder({
          data: [
            row({ id: 'n-open', data: { invitation_id: 'inv-open', tournament_id: 't-1', team_id: 'team-1', status: 'pending' } }),
            row({ id: 'n-cancelled', data: { invitation_id: 'inv-cancelled', tournament_id: 't-1', team_id: 'team-1', status: 'pending' } }),
            row({
              id: 'n-reply',
              kind: 'invite_response',
              title: 'Invitation accepted',
              message: 'Your invitation was accepted.',
              data: { invitation_id: 'inv-done', tournament_id: 't-1', team_id: 'team-1', status: 'accepted' },
              read_at: at(-5),
            }),
          ],
          error: null,
        });
      }
      if (table === 'invitations') {
        return builder({
          data: [
            { id: 'inv-open', kind: 'team_owner', status: 'pending', expires_at: at(60), tournament_id: 't-1', team_id: 'team-1' },
            { id: 'inv-cancelled', kind: 'team_owner', status: 'cancelled', expires_at: at(60), tournament_id: 't-1', team_id: 'team-1' },
          ],
          error: null,
        });
      }
      return builder({ data: [], error: null });
    });

    const list = await fetchNotifications(NOW);
    expect(list).toHaveLength(3);
    expect(list[0]).toMatchObject({
      id: 'n-open',
      kind: 'invite',
      isRead: false,
      meta: { invite: { invitationId: 'inv-open', status: 'pending' } },
    });
    expect(list[1]).toMatchObject({
      id: 'n-cancelled',
      kind: 'invite',
      meta: { invite: { invitationId: 'inv-cancelled', status: 'cancelled' } },
    });
    expect(list[2]).toMatchObject({
      id: 'n-reply',
      kind: 'invite_response',
      isRead: true,
      meta: { invite: { invitationId: 'inv-done', status: 'accepted' } },
    });
  });

  it('calls mark_notifications_read with ids or empty args for all', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await markNotificationsRead(['n-1']);
    expect(rpc).toHaveBeenLastCalledWith('mark_notifications_read', { p_ids: ['n-1'] });
    await markNotificationsRead(null);
    expect(rpc).toHaveBeenLastCalledWith('mark_notifications_read', {});
  });
});

describe('watchNotifications channel', () => {
  it('shares one Realtime channel per userId and removes it when the last listener unmounts', () => {
    const fakeChannel = {
      on: (...args: unknown[]) => {
        mockOn(...args);
        return fakeChannel;
      },
      subscribe: (cb: (status: string) => void) => {
        mockSubscribe();
        cb('SUBSCRIBED');
        return fakeChannel;
      },
    };
    channel.mockReturnValue(fakeChannel);

    const stopA = watchNotifications('u-1', jest.fn());
    const stopB = watchNotifications('u-1', jest.fn());
    expect(channel).toHaveBeenCalledTimes(1);

    stopA();
    expect(mockRemoveChannel).not.toHaveBeenCalled();
    stopB();
    expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel);
  });
});

