import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deletedTournamentsKey, myTournamentsKey, tournamentKey } from '../data/tournament-repository';
import { deleteTournament, restoreTournament } from '../data/tournament-writes';

/** Delete and restore, refreshing both the live list and Recently deleted afterwards. */
export function useTournamentTrash(userId: string) {
  const client = useQueryClient();
  const refresh = (id: string) => Promise.all([
    client.invalidateQueries({ queryKey: myTournamentsKey(userId) }),
    client.invalidateQueries({ queryKey: deletedTournamentsKey(userId) }),
    client.invalidateQueries({ queryKey: tournamentKey(id) }),
  ]);
  const remove = useMutation({ mutationFn: deleteTournament, onSuccess: (_d, id) => refresh(id) });
  const restore = useMutation({ mutationFn: restoreTournament, onSuccess: (_d, id) => refresh(id) });
  return { remove, restore };
}
