-- Fictional, non-login demonstration accounts and scorecards for the remote project.
-- Run once as an administrator. The transaction aborts if this fixture already exists.
begin;

do $$
declare
  names text[] := array[
    'Arman Rahman', 'Sabbir Hossain', 'Nayeem Hasan', 'Rafiul Islam', 'Tanvir Mahmud',
    'Imran Kabir', 'Sajjad Ahmed', 'Fahim Chowdhury', 'Rifat Uddin', 'Jahid Hasan',
    'Tareq Rahman', 'Arafat Hossain', 'Mehedi Hasan', 'Sohan Ahmed', 'Rakibul Islam',
    'Saifur Rahman', 'Abir Chowdhury', 'Nasir Uddin', 'Fardin Kabir', 'Riyad Hossain',
    'Ashik Ahmed', 'Farhan Islam', 'Muntasir Hasan', 'Shuvo Rahman', 'Mamun Chowdhury',
    'Rasel Ahmed', 'Shihab Hasan', 'Nafis Islam', 'Anik Rahman', 'Parvez Hossain',
    'Rubel Ahmed', 'Sharif Uddin', 'Rony Hasan', 'Shakil Islam', 'Masum Rahman',
    'Al Amin Hossain', 'Sumon Ahmed', 'Noman Kabir', 'Sakib Hasan', 'Biplob Roy'
  ];
  areas text[] := array['Agrabad', 'Halishahar', 'Pahartali', 'Chawkbazar', 'Nasirabad'];
  player_id uuid;
  game_id uuid;
  role_name text;
  game integer;
  side_no integer;
  player_no integer;
  global_no integer;
  over_no integer;
  ball_no integer;
  batter_base integer;
  bowler_base integer;
  striker integer;
  non_striker integer;
  next_batter integer;
  bowler integer;
  swap_player integer;
  run_value integer;
  scores integer[];
  is_wicket boolean;
begin
  if exists (select 1 from auth.users where id::text like 'c40a0000-0000-4000-8000-%')
     or exists (select 1 from public.matches where id::text like 'c40b0000-0000-4000-8000-%') then
    raise exception 'Bengali player fixture already exists; refusing to overwrite it';
  end if;

  for player_no in 1..40 loop
    player_id := ('c40a0000-0000-4000-8000-' || lpad(player_no::text, 12, '0'))::uuid;
    role_name := case when player_no <= 20 then 'batter'
      when player_no <= 25 then 'all-rounder'
      when player_no <= 30 then 'keeper' else 'bowler' end;
    -- No password or identity: these fixture accounts cannot be used to sign in.
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (player_id, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'fixture-player-' || player_no || '@example.invalid', null,
      '{"provider":"email","providers":[]}'::jsonb,
      jsonb_build_object('full_name', names[player_no], 'fixture', 'bengali_players_40'), now(), now());
    insert into public.profiles (id, full_name, area, district, role, batting_style)
    values (player_id, names[player_no], areas[1 + (player_no - 1) % 5],
      'Chattogram', role_name, case when player_no % 5 = 0 then 'left' else 'right' end)
    on conflict (id) do update set full_name = excluded.full_name, area = excluded.area,
      district = excluded.district, role = excluded.role, batting_style = excluded.batting_style;
  end loop;

  for game in 1..2 loop
    game_id := ('c40b0000-0000-4000-8000-' || lpad(game::text, 12, '0'))::uuid;
    insert into public.matches (id, created_by, fixture_ref, title, team_a_name, team_a_short,
      team_a_tone, team_b_name, team_b_short, team_b_tone, overs_limit, status,
      toss_winner_side, toss_decision, started_at, completed_at, result_type, winner_side, result_margin)
    values (game_id, ('c40a0000-0000-4000-8000-' || lpad(((game - 1) * 20 + 1)::text, 12, '0'))::uuid,
      'bengali-fixture-40-' || game, 'Fictional local cricket fixture ' || game,
      'Local XI A' || game, 'LA' || game, 'blue', 'Local XI B' || game, 'LB' || game,
      'yellow', 10, 'completed', 'a', 'bat', now() - interval '4 days',
      now() - interval '4 days' + interval '2 hours', 'runs', 'a', 1);

    for player_no in 1..20 loop
      global_no := (game - 1) * 20 + player_no;
      insert into public.match_players (match_id, key, side, name, role, in_playing_xi, sort_order, profile_id)
      select game_id, 'p' || global_no, case when player_no <= 10 then 'a' else 'b' end,
        p.full_name, p.role, true, (player_no - 1) % 10,
        p.id from public.profiles p
      where p.id = ('c40a0000-0000-4000-8000-' || lpad(global_no::text, 12, '0'))::uuid;
    end loop;

    scores := array[0, 0];
    for side_no in 1..2 loop
      batter_base := (game - 1) * 20 + case when side_no = 1 then 0 else 10 end;
      bowler_base := (game - 1) * 20 + case when side_no = 1 then 10 else 0 end;
      striker := batter_base + 1;
      non_striker := batter_base + 2;
      next_batter := batter_base + 3;
      insert into public.ball_events (id, match_id, innings, kind, striker_key, non_striker_key, bowler_key)
      values (gen_random_uuid(), game_id, side_no, 'innings_start', 'p' || striker,
        'p' || non_striker, 'p' || (bowler_base + 1));
      for over_no in 1..10 loop
        bowler := bowler_base + over_no;
        if over_no > 1 then
          insert into public.ball_events (id, match_id, innings, kind, bowler_key)
          values (gen_random_uuid(), game_id, side_no, 'bowler', 'p' || bowler);
        end if;
        for ball_no in 1..6 loop
          is_wicket := over_no <= 8 and ball_no = 6;
          run_value := case when is_wicket then 0 when ball_no in (1, 2) then 1
            when side_no = 1 then (array[0, 2, 4, 6])[1 + (over_no + ball_no) % 4]
            else (array[0, 0, 2, 4])[1 + (over_no + ball_no) % 4] end;
          insert into public.ball_events (id, match_id, innings, kind, striker_key,
            non_striker_key, bowler_key, delivery_kind, runs, total_runs, is_legal,
            dismissal, out_key, next_batter_key, fielder_key)
          values (gen_random_uuid(), game_id, side_no, 'delivery', 'p' || striker,
            'p' || non_striker, 'p' || bowler, case when is_wicket then 'wicket' else 'runs' end,
            run_value, run_value, true, case when is_wicket then 'Caught' else null end,
            case when is_wicket then 'p' || striker else null end,
            case when is_wicket then 'p' || next_batter else null end,
            case when is_wicket then 'p' || (bowler_base + 1 + over_no % 10) else null end);
          scores[side_no] := scores[side_no] + run_value;
          if is_wicket then
            striker := next_batter;
            next_batter := next_batter + 1;
          elsif run_value % 2 = 1 then
            swap_player := striker; striker := non_striker; non_striker := swap_player;
          end if;
        end loop;
        swap_player := striker; striker := non_striker; non_striker := swap_player;
      end loop;
    end loop;
    if scores[1] <= scores[2] then raise exception 'Fixture result is invalid'; end if;
    update public.matches set team_a_runs = scores[1], team_a_wickets = 8, team_a_balls = 60,
      team_b_runs = scores[2], team_b_wickets = 8, team_b_balls = 60,
      result_margin = scores[1] - scores[2],
      result_summary = 'Local XI A' || game || ' won by ' || (scores[1] - scores[2]) || ' runs'
    where id = game_id;
  end loop;
  if (select count(*) from public.player_career_stats where profile_id::text like 'c40a0000-0000-4000-8000-%'
      and innings > 0 and balls_faced > 0 and balls_bowled > 0) <> 40 then
    raise exception 'Every fixture player must have batting and bowling figures';
  end if;
end $$;
commit;
