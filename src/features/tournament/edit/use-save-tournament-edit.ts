import { useMutation, useQueryClient } from '@tanstack/react-query';

import { removeTournamentImages, uploadTournamentImage } from '../data/tournament-images';
import { myTournamentsKey, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { refusedByServer } from '../data/tournament-errors';
import { updateTournament } from '../data/tournament-writes';
import type { EditForm } from './edit-form';

/**
 * Uploads newly picked images, saves the edit, then deletes the images the tournament no longer uses, so storage
 * holds only the current cover and profile. If the server refuses the edit, the fresh uploads are deleted instead.
 */
export function useSaveTournamentEdit(t: TournamentRecord, userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (form: EditForm) => {
      const uploaded: string[] = [];
      const imageUrl = async (uri: string, previous: string | null | undefined, kind: 'cover' | 'profile') => {
        if (!uri) return null;
        if (uri === previous || uri.startsWith('https://')) return uri;
        const url = await uploadTournamentImage(userId, t.id, kind, uri);
        uploaded.push(url);
        return url;
      };
      let coverUrl: string | null;
      let profileUrl: string | null;
      let sent = false;
      try {
        coverUrl = await imageUrl(form.coverUri, t.coverUrl, 'cover');
        profileUrl = await imageUrl(form.profileUri, t.profileUrl, 'profile');
        sent = true;
        await updateTournament(t.id, { ...form, coverUrl, profileUrl });
      } catch (error) {
        // Only a refusal from the server proves the row was not changed; after a lost reply the new images may be in use.
        const refused = !sent || refusedByServer(error);
        if (refused) await removeTournamentImages(userId, t.id, uploaded);
        throw error;
      }
      await removeTournamentImages(userId, t.id, [
        coverUrl !== t.coverUrl ? t.coverUrl : null,
        profileUrl !== t.profileUrl ? t.profileUrl : null,
      ]);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: tournamentKey(t.id) });
      void client.invalidateQueries({ queryKey: myTournamentsKey(userId) });
    },
  });
}
