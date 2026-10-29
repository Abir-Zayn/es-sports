-- Local development fixture for grassroots Chattogram tape-ball cricket.
-- Dev fixture: excluded from the handwritten 270-line cap (memory.md section 3).
--
-- Applied by `supabase db reset` / `npm run db:reset-and-seed` after migrations.
-- Career tables are views, so the figures below come from ball_events, not inserts.
--
-- Local accounts (email confirmed, not for production):
--   tanvir.ahmed@local.essports.dev and the seven other *@local.essports.dev players
--   password: TapeBall2026!

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, email_change_confirm_status,
  reauthentication_token, is_sso_user, is_anonymous
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000001', 'authenticated', 'authenticated', 'tanvir.ahmed@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Tanvir Ahmed'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000002', 'authenticated', 'authenticated', 'liton.roy@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Liton Roy'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000003', 'authenticated', 'authenticated', 'rashedul.islam@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Rashedul Islam'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000004', 'authenticated', 'authenticated', 'arif.hossain@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Arif Hossain'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000005', 'authenticated', 'authenticated', 'shakib.chowdhury@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Shakib Chowdhury'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000006', 'authenticated', 'authenticated', 'mahmudul.hasan@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Mahmudul Hasan'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000007', 'authenticated', 'authenticated', 'kamrul.islam@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Kamrul Islam'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000008', 'authenticated', 'authenticated', 'zubair.almamun@local.essports.dev', extensions.crypt('TapeBall2026!', extensions.gen_salt('bf')), now(), now(), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), jsonb_build_object('full_name', 'Zubair Al Mamun'), now(), now(), '', '', '', '', '', '', '', 0, '', false, false);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  ('44444444-4444-4444-8444-000000000001', '11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000001', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000001', 'email', 'tanvir.ahmed@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000002', '11111111-1111-4111-8111-000000000002', '11111111-1111-4111-8111-000000000002', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000002', 'email', 'liton.roy@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000003', '11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-000000000003', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000003', 'email', 'rashedul.islam@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000004', '11111111-1111-4111-8111-000000000004', '11111111-1111-4111-8111-000000000004', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000004', 'email', 'arif.hossain@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000005', '11111111-1111-4111-8111-000000000005', '11111111-1111-4111-8111-000000000005', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000005', 'email', 'shakib.chowdhury@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000006', '11111111-1111-4111-8111-000000000006', '11111111-1111-4111-8111-000000000006', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000006', 'email', 'mahmudul.hasan@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000007', '11111111-1111-4111-8111-000000000007', '11111111-1111-4111-8111-000000000007', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000007', 'email', 'kamrul.islam@local.essports.dev', 'email_verified', true), 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-000000000008', '11111111-1111-4111-8111-000000000008', '11111111-1111-4111-8111-000000000008', jsonb_build_object('sub', '11111111-1111-4111-8111-000000000008', 'email', 'zubair.almamun@local.essports.dev', 'email_verified', true), 'email', now(), now(), now());

insert into public.profiles (id, full_name, area, district, role, batting_style)
values
  ('11111111-1111-4111-8111-000000000001', 'Tanvir Ahmed', 'Halishahar', 'Chattogram', 'all-rounder', 'right'),
  ('11111111-1111-4111-8111-000000000002', 'Liton Roy', 'Agrabad', 'Chattogram', 'batter', 'right'),
  ('11111111-1111-4111-8111-000000000003', 'Rashedul Islam', 'Pahartali', 'Chattogram', 'bowler', 'left'),
  ('11111111-1111-4111-8111-000000000004', 'Arif Hossain', 'Chawkbazar', 'Chattogram', 'keeper', 'right'),
  ('11111111-1111-4111-8111-000000000005', 'Shakib Chowdhury', 'GEC', 'Chattogram', 'all-rounder', 'left'),
  ('11111111-1111-4111-8111-000000000006', 'Mahmudul Hasan', 'Nasirabad', 'Chattogram', 'batter', 'right'),
  ('11111111-1111-4111-8111-000000000007', 'Kamrul Islam', 'Halishahar', 'Chattogram', 'bowler', 'right'),
  ('11111111-1111-4111-8111-000000000008', 'Zubair Al Mamun', 'Agrabad', 'Chattogram', 'batter', 'right')
on conflict (id) do update set
  full_name = excluded.full_name,
  area = excluded.area,
  district = excluded.district,
  role = excluded.role,
  batting_style = excluded.batting_style;

insert into public.profile_private (id, phone)
values
  ('11111111-1111-4111-8111-000000000001', '+8801711000001'),
  ('11111111-1111-4111-8111-000000000002', '+8801711000002'),
  ('11111111-1111-4111-8111-000000000003', '+8801711000003'),
  ('11111111-1111-4111-8111-000000000004', '+8801711000004'),
  ('11111111-1111-4111-8111-000000000005', '+8801711000005'),
  ('11111111-1111-4111-8111-000000000006', '+8801711000006'),
  ('11111111-1111-4111-8111-000000000007', '+8801711000007'),
  ('11111111-1111-4111-8111-000000000008', '+8801711000008');

insert into public.matches (
  id, created_by, fixture_ref, title,
  team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short, team_b_tone,
  overs_limit, status, toss_winner_side, toss_decision, record_shots,
  scheduled_at, started_at, completed_at,
  team_a_runs, team_a_wickets, team_a_balls, team_b_runs, team_b_wickets, team_b_balls,
  winner_side, result_type, result_margin, result_summary
) values
  (
    '22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000001', 'hpl-2026-hss-agt',
    'Halishahar Premier League 2026 · Halishahar Strikers vs Agrabad Tigers',
    'Halishahar Strikers', 'HSS', 'blue', 'Agrabad Tigers', 'AGT', 'yellow',
    6, 'completed', 'a', 'bat', true,
    now() - interval '4 hours', now() - interval '3 hours', now() - interval '2 hours',
    64, 2, 36, 52, 4, 36,
    'a', 'runs', 12, 'Halishahar Strikers won by 12 runs'
  ),
  (
    '22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000001', 'hpl-2026-pts-cbk',
    'Halishahar Premier League 2026 · Pahartali Smashers vs Chawkbazar Kings',
    'Pahartali Smashers', 'PTS', 'neutral', 'Chawkbazar Kings', 'CBK', 'blue',
    6, 'live', 'b', 'bowl', true,
    now() - interval '1 hour', now() - interval '40 minutes', null,
    null, null, null, null, null, null,
    null, null, null, null
  ),
  (
    '22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-000000000001', 'hpl-2026-hss-cbk',
    'Halishahar Premier League 2026 · Halishahar Strikers vs Chawkbazar Kings',
    'Halishahar Strikers', 'HSS', 'blue', 'Chawkbazar Kings', 'CBK', 'blue',
    6, 'scheduled', null, null, true,
    (date_trunc('day', now() at time zone 'Asia/Dhaka') + interval '1 day' + time '15:30') at time zone 'Asia/Dhaka',
    null, null,
    null, null, null, null, null, null,
    null, null, null, null
  );

insert into public.match_players (
  match_id, key, side, name, role, in_playing_xi, sort_order, profile_id
) values
  ('22222222-2222-4222-8222-000000000001', 'tanvir', 'a', 'Tanvir Ahmed', 'all-rounder', true, 0, '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000001', 'mahmudul', 'a', 'Mahmudul Hasan', 'batter', true, 1, '11111111-1111-4111-8111-000000000006'),
  ('22222222-2222-4222-8222-000000000001', 'shakib', 'a', 'Shakib Chowdhury', 'all-rounder', true, 2, '11111111-1111-4111-8111-000000000005'),
  ('22222222-2222-4222-8222-000000000001', 'kamrul', 'a', 'Kamrul Islam', 'bowler', true, 3, '11111111-1111-4111-8111-000000000007'),
  ('22222222-2222-4222-8222-000000000001', 'rashedul', 'a', 'Rashedul Islam', 'bowler', true, 4, '11111111-1111-4111-8111-000000000003'),
  ('22222222-2222-4222-8222-000000000001', 'hss-nayeem', 'a', 'Nayeem Uddin', 'batter', true, 5, null),
  ('22222222-2222-4222-8222-000000000001', 'hss-farhan', 'a', 'Farhan Kabir', 'all-rounder', true, 6, null),
  ('22222222-2222-4222-8222-000000000001', 'hss-sohag', 'a', 'Sohag Mia', 'bowler', true, 7, null),
  ('22222222-2222-4222-8222-000000000001', 'liton', 'b', 'Liton Roy', 'batter', true, 0, '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000001', 'zubair', 'b', 'Zubair Al Mamun', 'batter', true, 1, '11111111-1111-4111-8111-000000000008'),
  ('22222222-2222-4222-8222-000000000001', 'agt-imran', 'b', 'Imran Hossain', 'bowler', true, 2, null),
  ('22222222-2222-4222-8222-000000000001', 'agt-sabbir', 'b', 'Sabbir Rahman', 'all-rounder', true, 3, null),
  ('22222222-2222-4222-8222-000000000001', 'agt-nasir', 'b', 'Nasir Uddin', 'bowler', true, 4, null),
  ('22222222-2222-4222-8222-000000000001', 'agt-jahid', 'b', 'Jahidul Islam', 'keeper', true, 5, null),
  ('22222222-2222-4222-8222-000000000001', 'agt-rakib', 'b', 'Rakib Hasan', 'batter', true, 6, null),
  ('22222222-2222-4222-8222-000000000001', 'agt-forhad', 'b', 'Forhad Ali', 'bowler', true, 7, null),
  ('22222222-2222-4222-8222-000000000002', 'pts-sajjad', 'a', 'Sajjad Karim', 'batter', true, 0, null),
  ('22222222-2222-4222-8222-000000000002', 'pts-mehedi', 'a', 'Mehedi Hasan', 'batter', true, 1, null),
  ('22222222-2222-4222-8222-000000000002', 'rashedul', 'a', 'Rashedul Islam', 'bowler', true, 2, '11111111-1111-4111-8111-000000000003'),
  ('22222222-2222-4222-8222-000000000002', 'pts-nurul', 'a', 'Nurul Amin', 'all-rounder', true, 3, null),
  ('22222222-2222-4222-8222-000000000002', 'pts-shahed', 'a', 'Shahed Khan', 'bowler', true, 4, null),
  ('22222222-2222-4222-8222-000000000002', 'pts-ripon', 'a', 'Ripon Mia', 'batter', true, 5, null),
  ('22222222-2222-4222-8222-000000000002', 'pts-anwar', 'a', 'Anwar Hossain', 'keeper', true, 6, null),
  ('22222222-2222-4222-8222-000000000002', 'pts-belal', 'a', 'Belal Uddin', 'bowler', true, 7, null),
  ('22222222-2222-4222-8222-000000000002', 'arif', 'b', 'Arif Hossain', 'keeper', true, 0, '11111111-1111-4111-8111-000000000004'),
  ('22222222-2222-4222-8222-000000000002', 'cbk-rifat', 'b', 'Rifat Chowdhury', 'bowler', true, 1, null),
  ('22222222-2222-4222-8222-000000000002', 'cbk-noman', 'b', 'Noman Ali', 'all-rounder', true, 2, null),
  ('22222222-2222-4222-8222-000000000002', 'cbk-sumon', 'b', 'Sumon Das', 'batter', true, 3, null),
  ('22222222-2222-4222-8222-000000000002', 'cbk-jewel', 'b', 'Jewel Mia', 'batter', true, 4, null),
  ('22222222-2222-4222-8222-000000000002', 'cbk-iqbal', 'b', 'Iqbal Hossain', 'bowler', true, 5, null),
  ('22222222-2222-4222-8222-000000000002', 'cbk-tarek', 'b', 'Tarek Aziz', 'all-rounder', true, 6, null),
  ('22222222-2222-4222-8222-000000000002', 'cbk-minhaz', 'b', 'Minhaz Uddin', 'batter', true, 7, null),
  ('22222222-2222-4222-8222-000000000003', 'tanvir', 'a', 'Tanvir Ahmed', 'all-rounder', true, 0, '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000003', 'mahmudul', 'a', 'Mahmudul Hasan', 'batter', true, 1, '11111111-1111-4111-8111-000000000006'),
  ('22222222-2222-4222-8222-000000000003', 'shakib', 'a', 'Shakib Chowdhury', 'all-rounder', true, 2, '11111111-1111-4111-8111-000000000005'),
  ('22222222-2222-4222-8222-000000000003', 'kamrul', 'a', 'Kamrul Islam', 'bowler', true, 3, '11111111-1111-4111-8111-000000000007'),
  ('22222222-2222-4222-8222-000000000003', 'nx-nayeem', 'a', 'Nayeem Uddin', 'batter', true, 4, null),
  ('22222222-2222-4222-8222-000000000003', 'nx-farhan', 'a', 'Farhan Kabir', 'all-rounder', true, 5, null),
  ('22222222-2222-4222-8222-000000000003', 'nx-sohag', 'a', 'Sohag Mia', 'bowler', true, 6, null),
  ('22222222-2222-4222-8222-000000000003', 'nx-shahin', 'a', 'Shahin Alam', 'batter', true, 7, null),
  ('22222222-2222-4222-8222-000000000003', 'arif', 'b', 'Arif Hossain', 'keeper', true, 0, '11111111-1111-4111-8111-000000000004'),
  ('22222222-2222-4222-8222-000000000003', 'cbk-rifat', 'b', 'Rifat Chowdhury', 'bowler', true, 1, null),
  ('22222222-2222-4222-8222-000000000003', 'cbk-noman', 'b', 'Noman Ali', 'all-rounder', true, 2, null),
  ('22222222-2222-4222-8222-000000000003', 'cbk-sumon', 'b', 'Sumon Das', 'batter', true, 3, null),
  ('22222222-2222-4222-8222-000000000003', 'cbk-jewel', 'b', 'Jewel Mia', 'batter', true, 4, null),
  ('22222222-2222-4222-8222-000000000003', 'cbk-iqbal', 'b', 'Iqbal Hossain', 'bowler', true, 5, null),
  ('22222222-2222-4222-8222-000000000003', 'cbk-tarek', 'b', 'Tarek Aziz', 'all-rounder', true, 6, null),
  ('22222222-2222-4222-8222-000000000003', 'cbk-minhaz', 'b', 'Minhaz Uddin', 'batter', true, 7, null);

insert into public.ball_events (
  id, match_id, innings, kind, striker_key, non_striker_key, bowler_key,
  delivery_kind, runs, total_runs, is_legal, dismissal, out_key, next_batter_key, fielder_key, angle
) values
  ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000001', 1, 'innings_start', 'tanvir', 'mahmudul', 'agt-imran', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000002', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-imran', 'runs', 6, 6, true, null, null, null, null, 60),
  ('33333333-3333-4333-8333-000000000003', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-imran', 'runs', 1, 1, true, null, null, null, null, 8),
  ('33333333-3333-4333-8333-000000000004', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-imran', 'runs', 1, 1, true, null, null, null, null, 300),
  ('33333333-3333-4333-8333-000000000005', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-imran', 'runs', 1, 1, true, null, null, null, null, 235),
  ('33333333-3333-4333-8333-000000000006', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-imran', 'runs', 1, 1, true, null, null, null, null, 70),
  ('33333333-3333-4333-8333-000000000007', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-imran', 'runs', 1, 1, true, null, null, null, null, 12),
  ('33333333-3333-4333-8333-000000000008', '22222222-2222-4222-8222-000000000001', 1, 'bowler', null, null, 'agt-nasir', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000009', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-nasir', 'runs', 1, 1, true, null, null, null, null, 290),
  ('33333333-3333-4333-8333-000000000010', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-nasir', 'runs', 1, 1, true, null, null, null, null, 240),
  ('33333333-3333-4333-8333-000000000011', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-nasir', 'runs', 1, 1, true, null, null, null, null, 55),
  ('33333333-3333-4333-8333-000000000012', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-nasir', 'runs', 1, 1, true, null, null, null, null, 305),
  ('33333333-3333-4333-8333-000000000013', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-nasir', 'runs', 1, 1, true, null, null, null, null, 225),
  ('33333333-3333-4333-8333-000000000014', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-nasir', 'runs', 1, 1, true, null, null, null, null, 15),
  ('33333333-3333-4333-8333-000000000015', '22222222-2222-4222-8222-000000000001', 1, 'bowler', null, null, 'agt-forhad', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000016', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-forhad', 'runs', 1, 1, true, null, null, null, null, 60),
  ('33333333-3333-4333-8333-000000000017', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-forhad', 'runs', 1, 1, true, null, null, null, null, 8),
  ('33333333-3333-4333-8333-000000000018', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-forhad', 'runs', 1, 1, true, null, null, null, null, 300),
  ('33333333-3333-4333-8333-000000000019', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-forhad', 'runs', 6, 6, true, null, null, null, null, 235),
  ('33333333-3333-4333-8333-000000000020', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-forhad', 'runs', 4, 4, true, null, null, null, null, 70),
  ('33333333-3333-4333-8333-000000000021', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-forhad', 'runs', 4, 4, true, null, null, null, null, 12),
  ('33333333-3333-4333-8333-000000000022', '22222222-2222-4222-8222-000000000001', 1, 'bowler', null, null, 'agt-sabbir', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000023', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-sabbir', 'runs', 6, 6, true, null, null, null, null, 290),
  ('33333333-3333-4333-8333-000000000024', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-sabbir', 'runs', 4, 4, true, null, null, null, null, 240),
  ('33333333-3333-4333-8333-000000000025', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-sabbir', 'runs', 4, 4, true, null, null, null, null, 55),
  ('33333333-3333-4333-8333-000000000026', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-sabbir', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000027', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-sabbir', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000028', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-sabbir', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000029', '22222222-2222-4222-8222-000000000001', 1, 'bowler', null, null, 'agt-rakib', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000030', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-rakib', 'runs', 4, 4, true, null, null, null, null, 305),
  ('33333333-3333-4333-8333-000000000031', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-rakib', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000032', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'mahmudul', 'agt-rakib', 'runs', 1, 1, true, null, null, null, null, 225),
  ('33333333-3333-4333-8333-000000000033', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'mahmudul', 'tanvir', 'agt-rakib', 'wicket', 0, 0, true, 'Caught', 'mahmudul', 'shakib', 'agt-jahid', null),
  ('33333333-3333-4333-8333-000000000034', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'shakib', 'tanvir', 'agt-rakib', 'wide', 0, 1, false, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000035', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'shakib', 'tanvir', 'agt-rakib', 'no-ball', 0, 1, false, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000036', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'shakib', 'tanvir', 'agt-rakib', 'runs', 4, 4, true, null, null, null, null, 15),
  ('33333333-3333-4333-8333-000000000037', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'shakib', 'tanvir', 'agt-rakib', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000038', '22222222-2222-4222-8222-000000000001', 1, 'bowler', null, null, 'agt-jahid', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000039', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'shakib', 'agt-jahid', 'runs', 1, 1, true, null, null, null, null, 60),
  ('33333333-3333-4333-8333-000000000040', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'shakib', 'tanvir', 'agt-jahid', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000041', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'shakib', 'tanvir', 'agt-jahid', 'wicket', 0, 0, true, 'Bowled', 'shakib', 'kamrul', null, null),
  ('33333333-3333-4333-8333-000000000042', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'kamrul', 'tanvir', 'agt-jahid', 'runs', 1, 1, true, null, null, null, null, 8),
  ('33333333-3333-4333-8333-000000000043', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'tanvir', 'kamrul', 'agt-jahid', 'runs', 1, 1, true, null, null, null, null, 300),
  ('33333333-3333-4333-8333-000000000044', '22222222-2222-4222-8222-000000000001', 1, 'delivery', 'kamrul', 'tanvir', 'agt-jahid', 'runs', 2, 2, true, null, null, null, null, 235),
  ('33333333-3333-4333-8333-000000000045', '22222222-2222-4222-8222-000000000001', 2, 'innings_start', 'liton', 'zubair', 'rashedul', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000046', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'rashedul', 'runs', 4, 4, true, null, null, null, null, 70),
  ('33333333-3333-4333-8333-000000000047', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'rashedul', 'runs', 4, 4, true, null, null, null, null, 12),
  ('33333333-3333-4333-8333-000000000048', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000049', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000050', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000051', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000052', '22222222-2222-4222-8222-000000000001', 2, 'bowler', null, null, 'kamrul', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000053', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'zubair', 'liton', 'kamrul', 'runs', 1, 1, true, null, null, null, null, 290),
  ('33333333-3333-4333-8333-000000000054', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'zubair', 'kamrul', 'runs', 1, 1, true, null, null, null, null, 240),
  ('33333333-3333-4333-8333-000000000055', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'zubair', 'liton', 'kamrul', 'runs', 4, 4, true, null, null, null, null, 55),
  ('33333333-3333-4333-8333-000000000056', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'zubair', 'liton', 'kamrul', 'runs', 2, 2, true, null, null, null, null, 305),
  ('33333333-3333-4333-8333-000000000057', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'zubair', 'liton', 'kamrul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000058', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'zubair', 'liton', 'kamrul', 'runs', 1, 1, true, null, null, null, null, 225),
  ('33333333-3333-4333-8333-000000000059', '22222222-2222-4222-8222-000000000001', 2, 'bowler', null, null, 'rashedul', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000060', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'zubair', 'liton', 'rashedul', 'wicket', 0, 0, true, 'Caught', 'zubair', 'agt-imran', 'hss-nayeem', null),
  ('33333333-3333-4333-8333-000000000061', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-imran', 'liton', 'rashedul', 'runs', 6, 6, true, null, null, null, null, 15),
  ('33333333-3333-4333-8333-000000000062', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-imran', 'liton', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000063', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-imran', 'liton', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000064', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-imran', 'liton', 'rashedul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000065', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-imran', 'liton', 'rashedul', 'wicket', 0, 0, true, 'Bowled', 'agt-imran', 'agt-sabbir', null, null),
  ('33333333-3333-4333-8333-000000000066', '22222222-2222-4222-8222-000000000001', 2, 'bowler', null, null, 'shakib', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000067', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-sabbir', 'shakib', 'runs', 4, 4, true, null, null, null, null, 60),
  ('33333333-3333-4333-8333-000000000068', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-sabbir', 'shakib', 'runs', 2, 2, true, null, null, null, null, 8),
  ('33333333-3333-4333-8333-000000000069', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-sabbir', 'shakib', 'runs', 2, 2, true, null, null, null, null, 300),
  ('33333333-3333-4333-8333-000000000070', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-sabbir', 'shakib', 'runs', 2, 2, true, null, null, null, null, 235),
  ('33333333-3333-4333-8333-000000000071', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-sabbir', 'shakib', 'runs', 2, 2, true, null, null, null, null, 70),
  ('33333333-3333-4333-8333-000000000072', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-sabbir', 'shakib', 'runs', 2, 2, true, null, null, null, null, 12),
  ('33333333-3333-4333-8333-000000000073', '22222222-2222-4222-8222-000000000001', 2, 'bowler', null, null, 'tanvir', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000074', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-sabbir', 'liton', 'tanvir', 'runs', 6, 6, true, null, null, null, null, 290),
  ('33333333-3333-4333-8333-000000000075', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-sabbir', 'liton', 'tanvir', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000076', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-sabbir', 'liton', 'tanvir', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000077', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-sabbir', 'liton', 'tanvir', 'wicket', 0, 0, true, 'Bowled', 'agt-sabbir', 'agt-nasir', null, null),
  ('33333333-3333-4333-8333-000000000078', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-nasir', 'liton', 'tanvir', 'runs', 4, 4, true, null, null, null, null, 240),
  ('33333333-3333-4333-8333-000000000079', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-nasir', 'liton', 'tanvir', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000080', '22222222-2222-4222-8222-000000000001', 2, 'bowler', null, null, 'kamrul', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000081', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-nasir', 'kamrul', 'runs', 2, 2, true, null, null, null, null, 55),
  ('33333333-3333-4333-8333-000000000082', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-nasir', 'kamrul', 'runs', 2, 2, true, null, null, null, null, 305),
  ('33333333-3333-4333-8333-000000000083', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-nasir', 'kamrul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000084', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-nasir', 'kamrul', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000085', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'liton', 'agt-nasir', 'kamrul', 'runs', 1, 1, true, null, null, null, null, 225),
  ('33333333-3333-4333-8333-000000000086', '22222222-2222-4222-8222-000000000001', 2, 'delivery', 'agt-nasir', 'liton', 'kamrul', 'wicket', 0, 0, true, 'Caught', 'agt-nasir', 'agt-jahid', 'kamrul', null),
  ('33333333-3333-4333-8333-000000000087', '22222222-2222-4222-8222-000000000002', 1, 'innings_start', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000088', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'runs', 6, 6, true, null, null, null, null, 15),
  ('33333333-3333-4333-8333-000000000089', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'runs', 4, 4, true, null, null, null, null, 60),
  ('33333333-3333-4333-8333-000000000090', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'wide', 0, 1, false, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000091', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'no-ball', 0, 1, false, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000092', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'runs', 4, 4, true, null, null, null, null, 8),
  ('33333333-3333-4333-8333-000000000093', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'runs', 4, 4, true, null, null, null, null, 300),
  ('33333333-3333-4333-8333-000000000094', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000095', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-rifat', 'runs', 1, 1, true, null, null, null, null, 235),
  ('33333333-3333-4333-8333-000000000096', '22222222-2222-4222-8222-000000000002', 1, 'bowler', null, null, 'cbk-noman', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000097', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-noman', 'runs', 1, 1, true, null, null, null, null, 70),
  ('33333333-3333-4333-8333-000000000098', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-mehedi', 'pts-sajjad', 'cbk-noman', 'runs', 1, 1, true, null, null, null, null, 12),
  ('33333333-3333-4333-8333-000000000099', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-noman', 'runs', 1, 1, true, null, null, null, null, 290),
  ('33333333-3333-4333-8333-000000000100', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-mehedi', 'pts-sajjad', 'cbk-noman', 'runs', 1, 1, true, null, null, null, null, 240),
  ('33333333-3333-4333-8333-000000000101', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'cbk-noman', 'runs', 1, 1, true, null, null, null, null, 55),
  ('33333333-3333-4333-8333-000000000102', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-mehedi', 'pts-sajjad', 'cbk-noman', 'runs', 4, 4, true, null, null, null, null, 305),
  ('33333333-3333-4333-8333-000000000103', '22222222-2222-4222-8222-000000000002', 1, 'bowler', null, null, 'arif', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000104', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'pts-mehedi', 'arif', 'runs', 1, 1, true, null, null, null, null, 225),
  ('33333333-3333-4333-8333-000000000105', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-mehedi', 'pts-sajjad', 'arif', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000106', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-mehedi', 'pts-sajjad', 'arif', 'wicket', 0, 0, true, 'Bowled', 'pts-mehedi', 'rashedul', null, null),
  ('33333333-3333-4333-8333-000000000107', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'rashedul', 'pts-sajjad', 'arif', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000108', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'rashedul', 'pts-sajjad', 'arif', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000109', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'rashedul', 'pts-sajjad', 'arif', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000110', '22222222-2222-4222-8222-000000000002', 1, 'bowler', null, null, 'cbk-rifat', null, null, null, null, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000111', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'rashedul', 'cbk-rifat', 'runs', 0, 0, true, null, null, null, null, null),
  ('33333333-3333-4333-8333-000000000112', '22222222-2222-4222-8222-000000000002', 1, 'delivery', 'pts-sajjad', 'rashedul', 'cbk-rifat', 'runs', 0, 0, true, null, null, null, null, null);

do $$
declare
  tanvir_runs integer;
  mahmudul_balls integer;
  liton_runs integer;
  rash_wickets integer;
  rash_runs integer;
  rash_balls integer;
  caught_count integer;
  bowled_count integer;
begin
  select f.runs into tanvir_runs
  from public.player_match_figures f
  where f.profile_id = '11111111-1111-4111-8111-000000000001' and f.key = 'tanvir';
  if tanvir_runs is distinct from 34 then
    raise exception 'Tanvir Ahmed runs expected 34, got %', tanvir_runs;
  end if;

  select f.balls_faced into mahmudul_balls
  from public.player_match_figures f
  where f.profile_id = '11111111-1111-4111-8111-000000000006' and f.key = 'mahmudul';
  if mahmudul_balls is distinct from 14 then
    raise exception 'Mahmudul Hasan balls expected 14, got %', mahmudul_balls;
  end if;

  select f.runs into liton_runs
  from public.player_match_figures f
  where f.profile_id = '11111111-1111-4111-8111-000000000002' and f.key = 'liton';
  if liton_runs is distinct from 28 then
    raise exception 'Liton Roy runs expected 28, got %', liton_runs;
  end if;

  select f.wickets, f.runs_conceded, f.balls_bowled
    into rash_wickets, rash_runs, rash_balls
  from public.player_match_figures f
  where f.profile_id = '11111111-1111-4111-8111-000000000003' and f.match_id = '22222222-2222-4222-8222-000000000001';
  if rash_wickets is distinct from 2 or rash_runs is distinct from 14 or rash_balls is distinct from 12 then
    raise exception 'Rashedul Islam bowling expected 2/14 off 12, got %/% off %', rash_wickets, rash_runs, rash_balls;
  end if;

  select count(*) into caught_count from public.ball_events
  where dismissal = 'Caught' and fielder_key is not null;
  select count(*) into bowled_count from public.ball_events where dismissal = 'Bowled';
  if caught_count < 1 or bowled_count < 1 then
    raise exception 'Seed is missing a Caught fielder or a Bowled dismissal';
  end if;
end $$;
