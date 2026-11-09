import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assignStreamer, clearStreamer, streamersKey } from '@/features/broadcast/data/fixture-streamers';

/** The three ways the streamer of one match changes. Each refreshes the dashboard when it succeeds. */
export function useStreamerActions(tournamentId: string, fixtureId: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: streamersKey(tournamentId) });
  const assign = useMutation({ mutationFn: (userId: string) => assignStreamer(fixtureId, userId), onSuccess: refresh });
  const clear = useMutation({ mutationFn: () => clearStreamer(fixtureId), onSuccess: refresh });
  return { assign, clear, error: assign.error ?? clear.error, busy: assign.isPending || clear.isPending };
}
