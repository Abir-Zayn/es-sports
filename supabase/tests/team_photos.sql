-- Verification for team profile/cover photos (migration 20261119160000).
--
-- Fixture accounts: 1 tournament owner, 2 tournament moderator, 3 team owner, 4 unrelated stranger.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f9a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'team-photos-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Team Photos ' || n), now(), now()
from generate_series(1, 4) n;
insert into public.profiles (id, full_name)
select id, 'Team Photos' from auth.users where email like 'team-photos-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.update_tournament_team_images(uuid, uuid, text, text)', 'execute')
    or not has_function_privilege('authenticated', 'public.update_tournament_team_images(uuid, uuid, text, text)', 'execute')
    or has_function_privilege('anon', 'public.can_manage_team_media(text)', 'execute')
    or not has_function_privilege('authenticated', 'public.can_manage_team_media(text)', 'execute') then
    raise exception 'FAIL grants: functions must be authenticated only';
  end if;
end $$;

insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition, teams_planned,
  ball, side_format, players_per_side, min_squad, max_squad)
values ('f9c00000-0000-4000-8000-000000000001', 'f9a00000-0000-4000-8000-000000000001', 'Photo Cup', 'Chattogram', 'Ground',
  current_date, current_date + 3, 'T20', 'league', 4, 'Tennis', 'gully_6', 6, 6, 8);
insert into public.tournament_staff (tournament_id, user_id, role) values
  ('f9c00000-0000-4000-8000-000000000001', 'f9a00000-0000-4000-8000-000000000001', 'owner'),
  ('f9c00000-0000-4000-8000-000000000001', 'f9a00000-0000-4000-8000-000000000002', 'moderator');

insert into public.teams (id, name, short_name, created_by) values
  ('f9b00000-0000-4000-8000-00000000000a', 'Alpha', 'ALP', 'f9a00000-0000-4000-8000-000000000003'),
  ('f9b00000-0000-4000-8000-00000000000b', 'Bravo', 'BRV', 'f9a00000-0000-4000-8000-000000000001'),
  ('f9b00000-0000-4000-8000-00000000000c', 'Outside', 'OUT', 'f9a00000-0000-4000-8000-000000000003');
insert into public.team_members (team_id, profile_id, role) values
  ('f9b00000-0000-4000-8000-00000000000a', 'f9a00000-0000-4000-8000-000000000003', 'owner'),
  ('f9b00000-0000-4000-8000-00000000000b', 'f9a00000-0000-4000-8000-000000000001', 'owner'),
  ('f9b00000-0000-4000-8000-00000000000c', 'f9a00000-0000-4000-8000-000000000003', 'owner');
insert into public.tournament_teams (tournament_id, team_id) values
  ('f9c00000-0000-4000-8000-000000000001', 'f9b00000-0000-4000-8000-00000000000a'),
  ('f9c00000-0000-4000-8000-000000000001', 'f9b00000-0000-4000-8000-00000000000b');

insert into public.matches (id, tournament_id, fixture_ref, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short,
  team_b_tone, overs_limit, status)
values ('f9d00000-0000-4000-8000-000000000001', 'f9c00000-0000-4000-8000-000000000001', 'tournament-p1',
  'Alpha', 'ALP', 'neutral', 'Bravo', 'BRV', 'neutral', 20, 'scheduled');
insert into public.tournament_fixtures (tournament_id, number, stage, round, home_team_id, away_team_id, match_date, start_min, match_id)
values ('f9c00000-0000-4000-8000-000000000001', 1, 'League', 0,
  'f9b00000-0000-4000-8000-00000000000a', 'f9b00000-0000-4000-8000-00000000000b',
  current_date, 540, 'f9d00000-0000-4000-8000-000000000001');

set local role authenticated;

do $$
declare
  t uuid := 'f9c00000-0000-4000-8000-000000000001';
  team_a uuid := 'f9b00000-0000-4000-8000-00000000000a';
  team_c uuid := 'f9b00000-0000-4000-8000-00000000000c';
  as_user text := '{"sub":"f9a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  prev_logo text;
  prev_cover text;
  code text;
begin
  -- Unrelated user is refused (42501) and cannot manage media.
  perform set_config('request.jwt.claims', format(as_user, 4), true);
  if public.can_manage_team_media(team_a::text) or public.can_manage_team_media('bad-uuid') then
    raise exception 'FAIL media: stranger or bad uuid allowed';
  end if;
  begin
    perform public.update_tournament_team_images(t, team_a, 'https://example.com/a1.jpg', null);
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL auth: stranger gave %', code; end if;

  -- Tournament owner sets profile + cover and syncs linked match image.
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  if not public.can_manage_team_media(team_a::text) then raise exception 'FAIL media: owner denied'; end if;
  select previous_logo_url, previous_cover_url into prev_logo, prev_cover
    from public.update_tournament_team_images(t, team_a, 'https://example.com/a1.jpg', 'https://example.com/c1.jpg');
  if prev_logo is not null or prev_cover is not null then raise exception 'FAIL initial prev must be null'; end if;
  if (select team_a_image_url from public.matches where id = 'f9d00000-0000-4000-8000-000000000001')
    is distinct from 'https://example.com/a1.jpg' then
    raise exception 'FAIL match sync: team_a_image_url not updated';
  end if;

  -- Moderator replaces profile photo and receives previous URLs.
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  if not public.can_manage_team_media(team_a::text) then raise exception 'FAIL media: moderator denied'; end if;
  select previous_logo_url, previous_cover_url into prev_logo, prev_cover
    from public.update_tournament_team_images(t, team_a, 'https://example.com/a2.jpg', 'https://example.com/c1.jpg');
  if prev_logo is distinct from 'https://example.com/a1.jpg' or prev_cover is distinct from 'https://example.com/c1.jpg' then
    raise exception 'FAIL replace prev: % / %', prev_logo, prev_cover;
  end if;

  -- Team owner clears both photos and standings exposes logo_url.
  perform set_config('request.jwt.claims', format(as_user, 3), true);
  select previous_logo_url, previous_cover_url into prev_logo, prev_cover
    from public.update_tournament_team_images(t, team_a, null, null);
  if prev_logo is distinct from 'https://example.com/a2.jpg' or prev_cover is distinct from 'https://example.com/c1.jpg' then
    raise exception 'FAIL clear prev: % / %', prev_logo, prev_cover;
  end if;
  if (select logo_url from public.tournament_standings where tournament_id = t and team_id = team_a) is not null then
    raise exception 'FAIL standings logo_url should be null after clear';
  end if;

  -- Non-https URL is refused (22023) and team outside tournament is P0002.
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  code := null;
  begin
    perform public.update_tournament_team_images(t, team_a, 'http://bad.example/a.jpg', null);
  exception when others then code := sqlstate;
  end;
  if code is distinct from '22023' then raise exception 'FAIL http url gave %', code; end if;

  code := null;
  begin
    perform public.update_tournament_team_images(t, team_c, 'https://example.com/out.jpg', null);
  exception when others then code := sqlstate;
  end;
  if code is distinct from 'P0002' then raise exception 'FAIL outside team gave %', code; end if;
end $$;

reset role;
rollback;
