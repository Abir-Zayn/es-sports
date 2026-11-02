-- Run after the migrations on a disposable database. Every test change is rolled back.
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f8a00000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'start-fixture-' || n || '@example.invalid',
  '{"provider":"email","providers":[]}'::jsonb, jsonb_build_object('full_name', 'Player ' || n), now(), now()
from generate_series(1, 16) n;
insert into public.profiles (id, full_name)
select id, 'Player' from auth.users where email like 'start-fixture-%' on conflict (id) do nothing;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select public.create_tournament(jsonb_build_object('id', 'f8c00000-0000-4000-8000-000000000001', 'name', 'Start Cup',
  'city', 'Chattogram', 'venue', 'Ground', 'start_date', current_date, 'end_date', current_date + 5,
  'match_format', 'T20', 'competition', 'league', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'gully_6',
  'players_per_side', 6, 'min_squad', 6, 'max_squad', 8));
reset role;
insert into public.teams (id, name, short_name) values
  ('f8b00000-0000-4000-8000-000000000001', 'Alpha', 'ALP'),
  ('f8b00000-0000-4000-8000-000000000002', 'Bravo', 'BRV');
insert into public.tournament_teams (tournament_id, team_id)
select 'f8c00000-0000-4000-8000-000000000001', id from public.teams where id::text like 'f8b00000-%';
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f8c00000-0000-4000-8000-000000000001', 'f8a00000-0000-4000-8000-000000000002', 'moderator');
insert into public.team_members (team_id, profile_id, role)
select case when n <= 8 then 'f8b00000-0000-4000-8000-000000000001'::uuid else 'f8b00000-0000-4000-8000-000000000002'::uuid end,
  ('f8a00000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'player'
from generate_series(3, 14) n;
insert into public.tournament_squads (tournament_id, team_id, profile_id)
select 'f8c00000-0000-4000-8000-000000000001', team_id, profile_id from public.team_members
where team_id::text like 'f8b00000-%';
insert into public.tournament_fixtures (id, tournament_id, number, stage, round, home_team_id, away_team_id, match_date, start_min, status, cancel_reason, cancelled_at)
values
 ('f8d00000-0000-4000-8000-000000000001', 'f8c00000-0000-4000-8000-000000000001', 1, 'League', 0, 'f8b00000-0000-4000-8000-000000000001', 'f8b00000-0000-4000-8000-000000000002', current_date, 540, 'scheduled', null, null),
 ('f8d00000-0000-4000-8000-000000000002', 'f8c00000-0000-4000-8000-000000000001', 2, 'League', 0, 'f8b00000-0000-4000-8000-000000000001', 'f8b00000-0000-4000-8000-000000000002', current_date + 1, 540, 'cancelled', 'Rain', now());
insert into public.tournament_fixtures (id, tournament_id, number, stage, round, home_label, away_team_id, match_date, start_min)
values ('f8d00000-0000-4000-8000-000000000003', 'f8c00000-0000-4000-8000-000000000001', 3, 'Final', 1,
  'Winner', 'f8b00000-0000-4000-8000-000000000002', current_date + 2, 540);
set local role authenticated;
do $$
declare
  f uuid := 'f8d00000-0000-4000-8000-000000000001'; scorer uuid := 'f8a00000-0000-4000-8000-000000000015';
  h uuid[]; a uuid[]; m uuid; offer uuid; code text;
begin
  select array_agg(('f8a00000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid order by n) into h from generate_series(3, 8) n;
  select array_agg(('f8a00000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid order by n) into a from generate_series(9, 14) n;
  if has_function_privilege('anon', 'public.start_tournament_fixture(uuid,uuid,uuid[],uuid[])', 'execute') then raise exception 'FAIL anonymous grant'; end if;
  perform set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000016","role":"authenticated"}', true);
  begin perform public.start_tournament_fixture(f, scorer, h, a); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL staff: %', code; end if;
  perform set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
  code := null; begin perform public.start_tournament_fixture('f8d00000-0000-4000-8000-000000000003', scorer, h, a); exception when others then code := sqlstate; end;
  if code is distinct from 'ET007' then raise exception 'FAIL placeholder: %', code; end if;
  code := null; begin perform public.start_tournament_fixture('f8d00000-0000-4000-8000-000000000002', scorer, h, a); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL cancelled: %', code; end if;
  code := null; begin perform public.start_tournament_fixture(f, scorer, h[1:5], a); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL size: %', code; end if;
  code := null; begin perform public.start_tournament_fixture(f, scorer, array[h[1],h[1],h[3],h[4],h[5],h[6]], a); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL duplicates: %', code; end if;
  code := null; begin perform public.start_tournament_fixture(f, scorer, a, h); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL wrong squad: %', code; end if;
  code := null; begin perform public.start_tournament_fixture(f, '00000000-0000-4000-8000-000000000000', h, a); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL scorer: %', code; end if;
  reset role;
  update public.team_members set availability = 'injured' where profile_id = h[1];
  set local role authenticated;
  code := null; begin perform public.start_tournament_fixture(f, scorer, h, a); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL availability: %', code; end if;
  reset role; update public.team_members set availability = 'available' where profile_id = h[1]; set local role authenticated;
  m := public.start_tournament_fixture(f, scorer, h, a);
  if m is distinct from public.start_tournament_fixture(f, scorer, h, a) then raise exception 'FAIL retry'; end if;
  if (select match_id from public.tournament_fixtures where id = f) is distinct from m then raise exception 'FAIL link'; end if;
  if (select count(*) from public.match_players where match_id = m and in_playing_xi) <> 12 then raise exception 'FAIL players'; end if;
  if public.can_score_match(m) then raise exception 'FAIL creator can score'; end if;
  reset role;
  if (select count(*) from public.match_scorers where match_id = m) <> 1 then raise exception 'FAIL scorer count'; end if;
  if not exists (select 1 from public.notifications where user_id = scorer and data ->> 'match_id' = m::text) then raise exception 'FAIL notice'; end if;
  set local role authenticated;
  perform set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000015","role":"authenticated"}', true);
  if not public.can_score_match(m) then raise exception 'FAIL assigned scorer cannot score'; end if;
  offer := public.offer_scorer_handover(m, 'f8a00000-0000-4000-8000-000000000016');
  perform set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000016","role":"authenticated"}', true);
  perform public.accept_scorer_handover(offer);
  if not public.can_score_match(m) then raise exception 'FAIL handover'; end if;
  reset role;
  code := null;
  begin insert into public.match_scorers (match_id, user_id) values (m, scorer); exception when others then code := sqlstate; end;
  if code is null then raise exception 'FAIL second scorer accepted'; end if;
  set local role authenticated;
  update public.matches set status = 'live', toss_winner_side = 'a', toss_decision = 'bat' where id = m;
  perform public.append_ball_event(jsonb_build_object('id', 'f8e00000-0000-4000-8000-000000000001', 'match_id', m,
    'innings', 1, 'kind', 'innings_start', 'striker_key', h[1]::text, 'non_striker_key', h[2]::text, 'bowler_key', a[1]::text), null);
  perform public.append_ball_event(jsonb_build_object('id', 'f8e00000-0000-4000-8000-000000000002', 'match_id', m,
    'innings', 1, 'kind', 'delivery', 'striker_key', h[1]::text, 'non_striker_key', h[2]::text, 'bowler_key', a[1]::text,
    'delivery_kind', 'runs', 'runs', 4, 'total_runs', 4, 'is_legal', true), 'f8e00000-0000-4000-8000-000000000001');
  if not exists (select 1 from public.matches where id = m and team_a_runs = 4 and team_a_wickets = 0 and team_a_balls = 1 and team_b_runs is null)
    then raise exception 'FAIL live score'; end if;
  perform public.append_ball_event(jsonb_build_object('id', 'f8e00000-0000-4000-8000-000000000003', 'match_id', m,
    'innings', 1, 'kind', 'delivery', 'striker_key', h[1]::text, 'non_striker_key', h[2]::text, 'bowler_key', a[1]::text,
    'delivery_kind', 'wicket', 'runs', 0, 'total_runs', 0, 'is_legal', true, 'dismissal', 'Bowled', 'out_key', h[1]::text),
    'f8e00000-0000-4000-8000-000000000002');
  if not exists (select 1 from public.matches where id = m and team_a_runs = 4 and team_a_wickets = 1 and team_a_balls = 2)
    then raise exception 'FAIL live wicket'; end if;
  perform public.void_ball_events_from(m, 'f8e00000-0000-4000-8000-000000000003',
    'f8e00000-0000-4000-8000-000000000004', 'f8e00000-0000-4000-8000-000000000003');
  if not exists (select 1 from public.matches where id = m and team_a_runs = 4 and team_a_wickets = 0 and team_a_balls = 1)
    then raise exception 'FAIL undo totals'; end if;
end $$;
rollback;
