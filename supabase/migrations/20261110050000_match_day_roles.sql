-- Match-day rules for the new roles.
--
-- * Scorer: `start_tournament_fixture` (body of 20261102203607) now requires the scorer to be a moderator who has
--   the scoring duty, so the owner cannot score and a tournament needs a moderator before a match can start
--   (error ET012). When exactly one moderator has the streaming duty, that moderator becomes the match's streamer
--   automatically, so "Go live" is there as soon as the match starts.
-- * Streamer: `assign_fixture_streamer` (body of 20261110020000) requires the streaming duty.
-- * `seed_demo_teams` (body of 20261110010000) no longer leaves the caller as the team's owner: teams have none.
-- Error code: ET012 the scorer must be a moderator with the scoring duty.

create or replace function public.start_tournament_fixture(p_fixture uuid, p_scorer uuid, p_home_xi uuid[], p_away_xi uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  f public.tournament_fixtures; t public.tournaments; a public.teams; b public.teams;
  v_role text; v_match uuid := gen_random_uuid(); v_team uuid; v_players uuid[];
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'Fixture not found' using errcode = 'P0002'; end if;
  v_role := public.begin_tournament_change(f.tournament_id);
  if v_role is null or v_role not in ('owner', 'moderator') then
    raise exception 'Only tournament staff can start a match' using errcode = '42501';
  end if;
  select * into f from public.tournament_fixtures where id = p_fixture for update;
  if not found then raise exception 'Fixture not found' using errcode = 'P0002'; end if;
  if f.match_id is not null then return f.match_id; end if;
  if f.status <> 'scheduled' then raise exception 'Fixture is cancelled' using errcode = '22023'; end if;
  if f.home_team_id is null or f.away_team_id is null then
    raise exception 'Both teams must be known' using errcode = 'ET007';
  end if;
  -- Other team changes lock their team row; lock in stable order before inspecting availability.
  perform 1 from public.teams where id in (f.home_team_id, f.away_team_id) order by id for update;
  select * into t from public.tournaments where id = f.tournament_id;
  select * into a from public.teams where id = f.home_team_id;
  select * into b from public.teams where id = f.away_team_id;
  -- The scorer is a moderator who has the scoring duty; the owner does not score.
  if p_scorer is null or not exists (select 1 from public.tournament_staff
      where tournament_id = f.tournament_id and user_id = p_scorer and role = 'moderator' and can_score) then
    raise exception 'The scorer must be a moderator who has the scoring duty' using errcode = 'ET012';
  end if;
  for v_team, v_players in select f.home_team_id, p_home_xi union all select f.away_team_id, p_away_xi loop
    if v_players is null or cardinality(v_players) <> t.players_per_side
      or array_position(v_players, null) is not null
      or cardinality(v_players) <> (select count(distinct id) from unnest(v_players) id)
      or exists (select 1 from unnest(v_players) id
        left join public.tournament_squads s on s.tournament_id = f.tournament_id and s.team_id = v_team and s.profile_id = id
        left join public.team_members m on m.team_id = v_team and m.profile_id = id
        where s.profile_id is null or m.availability is distinct from 'available') then
      raise exception 'Choose the required number of available squad players for each team' using errcode = '22023';
    end if;
  end loop;
  insert into public.matches (id, tournament_id, fixture_ref, created_by, title,
    team_a_name, team_a_short, team_a_tone, team_a_image_url,
    team_b_name, team_b_short, team_b_tone, team_b_image_url, overs_limit, status)
  values (v_match, f.tournament_id, 'tournament-' || f.id, (select auth.uid()),
    'Match ' || f.number || ' · ' || f.stage,
    a.name, a.short_name, a.tone, a.logo_url, b.name, b.short_name, b.tone, b.logo_url,
    t.overs, 'scheduled');
  insert into public.match_players (match_id, key, side, name, profile_id, in_playing_xi, sort_order)
  select v_match, x.profile_id::text, x.side, coalesce(nullif(p.full_name, ''), 'Player'), x.profile_id, true, (x.n - 1)::smallint
  from (select id as profile_id, 'a'::text as side, n from unnest(p_home_xi) with ordinality as h(id, n)
        union all select id, 'b', n from unnest(p_away_xi) with ordinality as aw(id, n)) x
  join public.profiles p on p.id = x.profile_id;
  insert into public.match_scorers (match_id, user_id) values (v_match, p_scorer);
  update public.tournament_fixtures set match_id = v_match where id = f.id;
  -- With exactly one moderator who streams, that moderator is the streamer for this match without being asked.
  insert into public.fixture_streamers (fixture_id, tournament_id, streamer_id, assigned_by)
  select f.id, f.tournament_id, s.user_id, (select auth.uid())
    from public.tournament_staff s
   where s.tournament_id = f.tournament_id and s.role = 'moderator' and s.can_stream
     and (select count(*) from public.tournament_staff x where x.tournament_id = f.tournament_id and x.can_stream) = 1
  on conflict (fixture_id) do nothing;
  return v_match;
end $$;

create or replace function public.assign_fixture_streamer(p_fixture uuid, p_user uuid) returns void
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
  if not exists (select 1 from public.tournament_staff where tournament_id = f.tournament_id and user_id = p_user and role = 'moderator' and can_stream) then
    raise exception 'The streamer must be a moderator who has the streaming duty' using errcode = '22023';
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

create or replace function public.seed_demo_teams(p_tournament uuid, p_count int default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_names text[] := array['Demo Tigers', 'Demo Lions', 'Demo Eagles', 'Demo Sharks', 'Demo Wolves', 'Demo Falcons',
    'Demo Bulls', 'Demo Hawks', 'Demo Panthers', 'Demo Rhinos', 'Demo Cobras', 'Demo Giants', 'Demo Royals',
    'Demo Titans', 'Demo Rangers', 'Demo Stars'];
  v_shorts text[] := array['DTG', 'DLN', 'DEG', 'DSH', 'DWF', 'DFL', 'DBL', 'DHK', 'DPN', 'DRH', 'DCB', 'DGT', 'DRY', 'DTT', 'DRG', 'DST'];
  v_tones text[] := array['blue', 'yellow'];
  t public.tournaments;
  v_free int;
  v_made int := 0;
  v_team uuid;
  v_player uuid;
  v_slot int;
  p int;
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can add demo teams' using errcode = '42501';
  end if;
  if not coalesce((select enabled from public.app_flags where key = 'demo_data'), false) then
    raise exception 'Demo data is switched off' using errcode = 'ET009';
  end if;
  select * into t from public.tournaments where id = p_tournament;
  v_free := t.teams_planned - (select count(*) from public.tournament_teams where tournament_id = p_tournament);
  while v_made < least(v_free, coalesce(p_count, v_free)) loop
    -- first unused demo name (a name already in this tournament is skipped)
    select i into v_slot from generate_series(1, 16) i
     where not exists (select 1 from public.tournament_teams tt join public.teams x on x.id = tt.team_id
                        where tt.tournament_id = p_tournament and x.name = v_names[i])
     order by i limit 1;
    exit when v_slot is null;
    v_team := gen_random_uuid();
    perform public.insert_team(v_uid, v_team, v_names[v_slot], v_shorts[v_slot], v_tones[1 + (v_slot % 2)]);
    delete from public.team_members where team_id = v_team and profile_id = v_uid and role = 'owner'; -- teams have no owner
    perform public.link_tournament_team(p_tournament, v_team, 'owner');
    for p in 1..t.min_squad loop
      v_player := gen_random_uuid();
      insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      values (v_player, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'demo-' || v_player || '@demo.essports.invalid', '{"provider":"email","providers":[]}'::jsonb,
        jsonb_build_object('full_name', replace(v_names[v_slot], 'Demo ', '') || ' Player ' || p), now(), now());
      insert into public.profiles (id, full_name)
      values (v_player, replace(v_names[v_slot], 'Demo ', '') || ' Player ' || p)
      on conflict (id) do update set full_name = excluded.full_name;
      insert into public.team_members (team_id, profile_id, role) values (v_team, v_player, 'player');
      insert into public.tournament_squads (tournament_id, team_id, profile_id, added_by)
      values (p_tournament, v_team, v_player, v_uid);
    end loop;
    v_made := v_made + 1;
  end loop;
  return v_made;
end $$;
