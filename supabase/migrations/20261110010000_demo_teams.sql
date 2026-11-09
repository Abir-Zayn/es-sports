-- Demo teams: lets one tester fill a tournament with computer-made teams so the whole flow (fixtures, scoring,
-- live stream) can be tried with two phones.
--
-- * SAFE BY DEFAULT: everything here refuses to run unless the flag `demo_data` in `app_flags` is switched on.
--   The flag is off after this migration. Switch it on for a test project with
--     update public.app_flags set enabled = true where key = 'demo_data';
--   and off again with `enabled = false`. `app_flags` has row level security and no policies, so the app
--   cannot read or change it; only the SQL editor and the security definer functions can.
-- * `seed_demo_teams(tournament, count)`: tournament OWNER only. Fills free seats (at most `count`) with teams
--   named "Demo ...". Each team is owned by the caller (owning several teams in one tournament is allowed),
--   has `min_squad` demo players, and all of them are registered in the tournament squad. A demo player is an
--   `auth.users` row with a `@demo.essports.invalid` email and no password, so nobody can sign in as one.
-- * `clear_demo_teams(tournament)`: owner only. Removes the "Demo ..." teams (refused with ET005 while they
--   have scheduled matches, like any removal) and deletes their demo players.
-- Error codes: 42501 not allowed, P0002 not found (from begin_tournament_change), ET009 demo data is switched off.

create table public.app_flags (
  key text primary key,
  enabled boolean not null default false
);
alter table public.app_flags enable row level security;
revoke all on public.app_flags from public, anon, authenticated;
insert into public.app_flags (key, enabled) values ('demo_data', false);

create function public.seed_demo_teams(p_tournament uuid, p_count int default null) returns int
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

create function public.clear_demo_teams(p_tournament uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_team uuid;
  v_removed int := 0;
  v_players uuid[];
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can remove demo teams' using errcode = '42501';
  end if;
  if not coalesce((select enabled from public.app_flags where key = 'demo_data'), false) then
    raise exception 'Demo data is switched off' using errcode = 'ET009';
  end if;
  for v_team in
    select x.id from public.tournament_teams tt join public.teams x on x.id = tt.team_id
     where tt.tournament_id = p_tournament and x.name like 'Demo %' and x.created_by = (select auth.uid())
  loop
    select coalesce(array_agg(m.profile_id), '{}') into v_players
      from public.team_members m join auth.users u on u.id = m.profile_id
     where m.team_id = v_team and u.email like '%@demo.essports.invalid';
    perform public.remove_tournament_team(p_tournament, v_team);
    delete from public.teams where id = v_team;
    delete from auth.users where id = any (v_players);
    v_removed := v_removed + 1;
  end loop;
  return v_removed;
end $$;

revoke all on function public.seed_demo_teams(uuid, int), public.clear_demo_teams(uuid) from public, anon;
grant execute on function public.seed_demo_teams(uuid, int), public.clear_demo_teams(uuid) to authenticated;
