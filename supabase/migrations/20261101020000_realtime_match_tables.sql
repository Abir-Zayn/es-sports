-- Realtime for spectators: publish changes to matches and ball_events.
--
-- * The spectator screens open one Realtime channel per match (src/features/match/live/match-channel.ts) and
--   refresh as soon as the scorer saves. Without this publication the channel receives nothing and the screens
--   keep polling every 15 seconds, so applying this is safe at any time and the app works either way.
-- * Realtime respects row level security: subscribers receive only rows their select policies allow. Both
--   tables are readable by any signed-in user, as the spectator screens already are.
-- * Idempotent: a table already in the publication is left alone.

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['matches', 'ball_events'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
