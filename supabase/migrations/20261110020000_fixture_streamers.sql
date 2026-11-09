-- Who streams a tournament match live (Facebook Live, from the streamer's phone).
--
-- * The streamer is a tournament MODERATOR (never the owner, never a player): the owner assigns one moderator to
--   a fixture, or a moderator takes it for themself. One streamer per fixture. A tournament has at most 3
--   moderators (20261110000000), so there are at most 3 possible streamers.
-- * `fixture_streamers` is keyed by fixture (the match row only exists once the match starts). Its foreign key to
--   `tournament_staff` makes the assignment vanish if that moderator is removed from the tournament.
-- * `state`: assigned -> live -> ended. Only the streamer moves it (`set_fixture_broadcast_state`), and going live
--   needs the match to have started (`match_id` set), so the score graphics have a match to follow. The stream key
--   is NEVER stored: it stays on the streamer's phone.
-- * `platform` is 'facebook' for now (a check, so adding YouTube later is a one-line migration).
-- * Any signed-in user reads the table (spectators see "LIVE on Facebook"); rows change only through the RPCs.
-- * Error codes: 42501 not allowed, 22023 invalid input, P0002 not found, ET010 the broadcast has already started
--   or ended (cannot be reassigned or cleared), ET011 start the match first.

create table public.fixture_streamers (
  fixture_id uuid primary key references public.tournament_fixtures (id) on delete cascade,
  tournament_id uuid not null,
  streamer_id uuid not null,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  platform text not null default 'facebook' check (platform in ('facebook')),
  state text not null default 'assigned' check (state in ('assigned', 'live', 'ended')),
  live_at timestamptz,
  ended_at timestamptz,
  foreign key (tournament_id, streamer_id) references public.tournament_staff (tournament_id, user_id) on delete cascade,
  check ((state = 'assigned') = (live_at is null)),
  check ((state = 'ended') = (ended_at is not null))
);
create index fixture_streamers_streamer_idx on public.fixture_streamers (streamer_id);
create index fixture_streamers_tournament_idx on public.fixture_streamers (tournament_id);

alter table public.fixture_streamers enable row level security;
create policy fixture_streamers_read on public.fixture_streamers for select to authenticated using (true);
revoke all on public.fixture_streamers from public, anon, authenticated;
grant select on public.fixture_streamers to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fixture_streamers') then
    alter publication supabase_realtime add table public.fixture_streamers;
  end if;
end $$;

-- The owner assigns any moderator; a moderator may take it for themself (p_user = themself).
create function public.assign_fixture_streamer(p_fixture uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  f public.tournament_fixtures;
  v_role text;
  v_state text;
  v_current uuid;
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'Match not found' using errcode = 'P0002'; end if;
  v_role := public.begin_tournament_change(f.tournament_id);
  if v_role is null or (v_role <> 'owner' and not (v_role = 'moderator' and p_user = v_uid)) then
    raise exception 'Only the owner can choose the streamer; a moderator can take it for themself' using errcode = '42501';
  end if;
  if not exists (select 1 from public.tournament_staff where tournament_id = f.tournament_id and user_id = p_user and role = 'moderator') then
    raise exception 'The streamer must be a moderator of this tournament' using errcode = '22023';
  end if;
  select * into f from public.tournament_fixtures where id = p_fixture for update;
  if f.status <> 'scheduled' then raise exception 'This match is cancelled' using errcode = '22023'; end if;
  select state, streamer_id into v_state, v_current from public.fixture_streamers where fixture_id = p_fixture for update;
  if v_state in ('live', 'ended') then raise exception 'The broadcast has already started' using errcode = 'ET010'; end if;
  if v_role = 'moderator' and v_current is not null and v_current <> v_uid then
    raise exception 'Another moderator is already the streamer; only the owner can change that' using errcode = '42501';
  end if;
  insert into public.fixture_streamers (fixture_id, tournament_id, streamer_id, assigned_by)
  values (p_fixture, f.tournament_id, p_user, v_uid)
  on conflict (fixture_id) do update set streamer_id = excluded.streamer_id, assigned_by = excluded.assigned_by, assigned_at = now();
  if p_user <> v_uid then
    insert into public.notifications (user_id, kind, title, message, data)
    values (p_user, 'system', 'You are the streamer', 'You were chosen to stream a tournament match live.',
      jsonb_build_object('tournament_id', f.tournament_id, 'fixture_id', f.id, 'event', 'streamer_assigned'));
  end if;
end $$;

-- The owner or the streamer clears the assignment, until the broadcast starts.
create function public.clear_fixture_streamer(p_fixture uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  f public.tournament_fixtures;
  s public.fixture_streamers;
  v_role text;
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'Match not found' using errcode = 'P0002'; end if;
  v_role := public.begin_tournament_change(f.tournament_id);
  select * into s from public.fixture_streamers where fixture_id = p_fixture for update;
  if not found then return; end if;
  if v_role is distinct from 'owner' and s.streamer_id is distinct from v_uid then
    raise exception 'Only the owner or the streamer can clear the streamer' using errcode = '42501';
  end if;
  if s.state <> 'assigned' then raise exception 'The broadcast has already started' using errcode = 'ET010'; end if;
  delete from public.fixture_streamers where fixture_id = p_fixture;
end $$;

-- The streamer marks the broadcast live or ended. Idempotent: repeating the current state is fine.
create function public.set_fixture_broadcast_state(p_fixture uuid, p_state text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  f public.tournament_fixtures;
  s public.fixture_streamers;
begin
  if p_state is null or p_state not in ('live', 'ended') then
    raise exception 'State must be live or ended' using errcode = '22023';
  end if;
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'Match not found' using errcode = 'P0002'; end if;
  perform public.begin_tournament_change(f.tournament_id);
  select * into s from public.fixture_streamers where fixture_id = p_fixture for update;
  if not found or s.streamer_id is distinct from v_uid then
    raise exception 'Only the assigned streamer can change the broadcast' using errcode = '42501';
  end if;
  if s.state = p_state then return; end if;
  if p_state = 'live' then
    if s.state = 'ended' then raise exception 'The broadcast has already ended' using errcode = 'ET010'; end if;
    if f.match_id is null then raise exception 'Start the match before going live' using errcode = 'ET011'; end if;
    update public.fixture_streamers set state = 'live', live_at = now() where fixture_id = p_fixture;
  else
    update public.fixture_streamers set state = 'ended', ended_at = now(), live_at = coalesce(live_at, now()) where fixture_id = p_fixture;
  end if;
end $$;

revoke all on function public.assign_fixture_streamer(uuid, uuid), public.clear_fixture_streamer(uuid),
  public.set_fixture_broadcast_state(uuid, text) from public, anon;
grant execute on function public.assign_fixture_streamer(uuid, uuid), public.clear_fixture_streamer(uuid),
  public.set_fixture_broadcast_state(uuid, text) to authenticated;
