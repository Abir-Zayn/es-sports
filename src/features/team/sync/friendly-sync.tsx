import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';

import { SyncPanel, type SyncTeam } from './sync-panel';

type TeamRow = { id: string; name: string; short_name: string; tone: string | null; logo_url: string | null } | null;
const tones: readonly string[] = ['blue', 'yellow', 'neutral'];
const toTeam = (row: TeamRow): SyncTeam[] => (row ? [{
  id: row.id, name: row.name, short: row.short_name, tone: (tones.includes(row.tone ?? '') ? row.tone : 'neutral') as AvatarTone, logoUrl: row.logo_url,
}] : []);

/** Who set up a friendly, whether it is over, and the existing teams that played it. */
async function fetchFriendlyTeams(matchId: string) {
  const { data, error } = await supabase.from('matches')
    .select('created_by, status, tournament_id, team_a:teams!matches_team_a_id_fkey(id, name, short_name, tone, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, short_name, tone, logo_url)')
    .eq('id', matchId).maybeSingle();
  if (error) throw error;
  return data as unknown as { created_by: string | null; status: string; tournament_id: string | null; team_a: TeamRow; team_b: TeamRow } | null;
}

/** On a finished friendly, its creator sends the result to the record of each existing team that played. */
export function FriendlySync({ matchId }: { matchId: string }) {
  const meId = useAuth().session?.user.id ?? '';
  const match = useQuery({ queryKey: ['friendly-sync-teams', matchId], queryFn: () => fetchFriendlyTeams(matchId), enabled: Boolean(matchId && meId) });
  const m = match.data;
  if (!m || m.created_by !== meId || m.status !== 'completed' || m.tournament_id) return null;
  const teams = [...toTeam(m.team_a), ...toTeam(m.team_b)];
  return teams.length > 0 ? <SyncPanel target={{ matchId }} teams={teams} /> : null;
}
