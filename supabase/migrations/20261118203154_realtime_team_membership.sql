-- Realtime for team membership and tournament squads.
--
-- * A player who leaves a team (`remove_team_member` on their own profile) or is removed drops out of
--   `team_members`, and the `tournament_squads` foreign key cascades them out of every squad of that team.
-- * Publishing both tables lets open screens refresh at once: the team's member list, "Your teams" on Home and
--   Profile, and each tournament's squads and roster. Both tables are readable by any signed-in user already.
-- * Delete events carry only the primary key (default replica identity), which holds every id the app needs.
-- * Idempotent: a table already in the publication is left alone.

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['team_members', 'tournament_squads'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
