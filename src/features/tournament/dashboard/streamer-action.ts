import type { BroadcastState } from '@/features/broadcast/data/fixture-streamers';

export type StreamerView = { streamerId: string; state: BroadcastState } | null;
export type Viewer = { userId: string | null; role: 'owner' | 'moderator' | null };

/** What the viewer can do about streaming this match. `none` shows no button. */
export type StreamerAction = 'choose' | 'take' | 'wait-for-match' | 'go-live' | 'resume-live' | 'none';

/**
 * - the owner picks the streamer (`choose`) until the broadcast starts;
 * - a moderator can `take` an unassigned match;
 * - the assigned streamer sees `wait-for-match` until the match has started, then `go-live`, and `resume-live`
 *   while the broadcast is live (re-opening the console after the app was closed);
 * - everyone else, and everyone once the broadcast has ended, sees nothing.
 */
export function streamerAction(viewer: Viewer, streamer: StreamerView, matchStarted: boolean): StreamerAction {
  if (!viewer.userId || !viewer.role) return 'none';
  const isStreamer = streamer?.streamerId === viewer.userId;
  if (isStreamer && streamer.state === 'live') return 'resume-live';
  if (isStreamer && streamer.state === 'assigned') return matchStarted ? 'go-live' : 'wait-for-match';
  if (streamer?.state === 'live' || streamer?.state === 'ended') return 'none';
  if (viewer.role === 'owner') return 'choose';
  if (viewer.role === 'moderator' && !streamer) return 'take';
  return 'none';
}
