-- Tournament rounds: group rounds, then a straight knockout.
--
-- * Round 0 is the first group stage. It keeps its data where it already lives: `tournaments.groups_planned`,
--   `tournaments.advance_per_group` and `tournament_teams.group_index`. Every entered team is in it.
-- * Rounds 1+ are rows of `tournament_rounds`; their teams (and group or bracket slot) are `tournament_round_teams`.
--   A 'groups' round is played as League fixtures with `round` = that round. A 'knockout' round is the whole bracket
--   (Quarter-final, Semi-final, Final fixtures) and is always the last round.
-- * `advance_tournament_round`: once every League match of the latest group round is finished or cancelled (ET017),
--   the owner sends the teams that go through. 2, 4 or 8 teams start the knockout, in bracket order (slot 0 meets
--   slot 1, 2 meets 3, …); any other count is a new group round of `p_groups` groups. The rest are eliminated.
-- * `draw_tournament_round` / `swap_tournament_round_teams` draw or swap the groups of the latest group round,
--   replacing `draw_tournament_groups` / `swap_tournament_group_teams`.
-- * `confirm_knockout_winner`: the owner settles a finished (or cancelled) knockout match. The winner fills the
--   "Winner of Match N" side of the next match; the loser is eliminated. Ties and no-results are the owner's call.
-- * `add_tournament_fixtures` appends a round's matches to a schedule whose earlier matches have started.
-- * A tournament may have up to 1200 matches (was 200).
-- * Standings gain a `round` column: one row per team per group round, counting only that round's matches.

create table public.tournament_rounds (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  round smallint not null check (round between 1 and 10),
  kind text not null check (kind in ('groups', 'knockout')),
  groups smallint not null default 1 check (groups between 1 and 8),
  advance smallint check (advance >= 1),
  created_at timestamptz not null default now(),
  primary key (tournament_id, round)
);
create table public.tournament_round_teams (
  tournament_id uuid not null,
  round smallint not null,
  team_id uuid not null references public.teams (id) on delete cascade,
  group_index smallint check (group_index between 0 and 7),
  slot smallint check (slot between 0 and 15),
  primary key (tournament_id, round, team_id),
  foreign key (tournament_id, round) references public.tournament_rounds (tournament_id, round) on delete cascade
);
alter table public.tournament_rounds enable row level security;
alter table public.tournament_round_teams enable row level security;
create policy "tournament_rounds: signed-in users can read"
  on public.tournament_rounds for select to authenticated using (true);
create policy "tournament_round_teams: signed-in users can read"
  on public.tournament_round_teams for select to authenticated using (true);

-- Up to 1200 matches per tournament.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.tournament_fixtures'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) like '%number%' loop
    execute format('alter table public.tournament_fixtures drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.tournament_fixtures add constraint tournament_fixtures_number_check check (number between 1 and 1200);

create function public.latest_tournament_round(p_tournament uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(max(round), 0)::int from public.tournament_rounds where tournament_id = p_tournament
$$;
revoke all on function public.latest_tournament_round(uuid) from public, anon, authenticated;

-- Owner check plus the draw/swap preconditions for the latest group round. Returns its group count.
create function public.begin_round_change(p_tournament uuid, p_round int) returns int
language plpgsql security definer set search_path = '' as $$
declare t public.tournaments; r public.tournament_rounds;
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can change the groups' using errcode = '42501';
  end if;
  select * into t from public.tournaments where id = p_tournament for update;
  if p_round is distinct from public.latest_tournament_round(p_tournament) then
    raise exception 'Only the latest round can be changed' using errcode = '22023';
  end if;
  if exists (select 1 from public.tournament_fixtures where tournament_id = p_tournament and stage = 'League'
             and round = p_round and match_id is not null) then
    raise exception 'A match has started, so the groups are locked' using errcode = 'ET016';
  end if;
  if p_round = 0 then
    if t.groups_planned < 2 then raise exception 'This round has no groups' using errcode = '22023'; end if;
    if (select count(*) from public.tournament_teams where tournament_id = p_tournament) <> t.teams_planned then
      raise exception 'Every team must join before the groups are drawn' using errcode = 'ET015';
    end if;
    return t.groups_planned;
  end if;
  select * into r from public.tournament_rounds where tournament_id = p_tournament and round = p_round;
  if r.kind <> 'groups' or r.groups < 2 then raise exception 'This round has no groups' using errcode = '22023'; end if;
  return r.groups;
end $$;
revoke all on function public.begin_round_change(uuid, int) from public, anon, authenticated;

create function public.draw_tournament_round(p_tournament uuid, p_round int, p_advance int) returns void
language plpgsql security definer set search_path = '' as $$
declare v_groups int; v_size int;
begin
  v_groups := public.begin_round_change(p_tournament, p_round);
  v_size := case when p_round = 0 then (select teams_planned from public.tournaments where id = p_tournament)
    else (select count(*) from public.tournament_round_teams where tournament_id = p_tournament and round = p_round) end;
  if p_advance is null or p_advance not between 1 and v_size / v_groups then
    raise exception 'Choose how many teams of each group go through' using errcode = '22023';
  end if;
  if p_round = 0 then
    update public.tournaments set advance_per_group = p_advance where id = p_tournament;
    update public.tournament_teams tt set group_index = d.g
      from (select team_id, ((row_number() over (order by random())) - 1) % v_groups as g
              from public.tournament_teams where tournament_id = p_tournament) d
     where tt.tournament_id = p_tournament and tt.team_id = d.team_id;
  else
    update public.tournament_rounds set advance = p_advance where tournament_id = p_tournament and round = p_round;
    update public.tournament_round_teams rt set group_index = d.g
      from (select team_id, ((row_number() over (order by random())) - 1) % v_groups as g
              from public.tournament_round_teams where tournament_id = p_tournament and round = p_round) d
     where rt.tournament_id = p_tournament and rt.round = p_round and rt.team_id = d.team_id;
  end if;
end $$;
revoke all on function public.draw_tournament_round(uuid, int, int) from public, anon;
grant execute on function public.draw_tournament_round(uuid, int, int) to authenticated;

create function public.swap_tournament_round_teams(p_tournament uuid, p_round int, p_team_a uuid, p_team_b uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_a smallint; v_b smallint;
begin
  perform public.begin_round_change(p_tournament, p_round);
  if p_round = 0 then
    select group_index into v_a from public.tournament_teams where tournament_id = p_tournament and team_id = p_team_a;
    select group_index into v_b from public.tournament_teams where tournament_id = p_tournament and team_id = p_team_b;
  else
    select group_index into v_a from public.tournament_round_teams where tournament_id = p_tournament and round = p_round and team_id = p_team_a;
    select group_index into v_b from public.tournament_round_teams where tournament_id = p_tournament and round = p_round and team_id = p_team_b;
  end if;
  if v_a is null or v_b is null then raise exception 'Both teams must be in a drawn group' using errcode = 'P0002'; end if;
  if v_a = v_b then raise exception 'Pick teams from two different groups' using errcode = '22023'; end if;
  if p_round = 0 then
    update public.tournament_teams set group_index = case when team_id = p_team_a then v_b else v_a end
     where tournament_id = p_tournament and team_id in (p_team_a, p_team_b);
  else
    update public.tournament_round_teams set group_index = case when team_id = p_team_a then v_b else v_a end
     where tournament_id = p_tournament and round = p_round and team_id in (p_team_a, p_team_b);
  end if;
end $$;
revoke all on function public.swap_tournament_round_teams(uuid, int, uuid, uuid) from public, anon;
grant execute on function public.swap_tournament_round_teams(uuid, int, uuid, uuid) to authenticated;

drop function public.draw_tournament_groups(uuid, int);
drop function public.swap_tournament_group_teams(uuid, uuid, uuid);
drop function public.begin_group_change(uuid);

create function public.advance_tournament_round(p_tournament uuid, p_from int, p_teams uuid[], p_groups int) returns void
language plpgsql security definer set search_path = '' as $$
declare v_members uuid[]; v_n int; v_kind text;
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can start the next round' using errcode = '42501';
  end if;
  perform 1 from public.tournaments where id = p_tournament for update;
  if p_from is distinct from public.latest_tournament_round(p_tournament)
     or exists (select 1 from public.tournament_rounds where tournament_id = p_tournament and round = p_from and kind <> 'groups') then
    raise exception 'Only the latest group round can lead to the next' using errcode = '22023';
  end if;
  if not exists (select 1 from public.tournament_fixtures where tournament_id = p_tournament and stage = 'League' and round = p_from)
     or exists (select 1 from public.tournament_fixtures f left join public.matches m on m.id = f.match_id
                 where f.tournament_id = p_tournament and f.stage = 'League' and f.round = p_from and f.status = 'scheduled'
                   and (m.id is null or m.status <> 'completed')) then
    raise exception 'Finish every match of this round first' using errcode = 'ET017';
  end if;
  v_members := case when p_from = 0
    then array(select team_id from public.tournament_teams where tournament_id = p_tournament)
    else array(select team_id from public.tournament_round_teams where tournament_id = p_tournament and round = p_from) end;
  v_n := coalesce(cardinality(p_teams), 0);
  if v_n < 2 or v_n >= cardinality(v_members) or not (p_teams <@ v_members)
     or v_n <> (select count(distinct x) from unnest(p_teams) x) then
    raise exception 'Choose fewer teams than played this round, from this round' using errcode = '22023';
  end if;
  v_kind := case when p_groups = 0 then 'knockout' else 'groups' end;
  if v_kind = 'knockout' and v_n not in (2, 4, 8) then
    raise exception 'A knockout needs 2, 4 or 8 teams' using errcode = '22023';
  end if;
  if v_kind = 'groups' and (p_groups is null or p_groups not between 1 and 8 or v_n % p_groups <> 0 or v_n < 3 * p_groups) then
    raise exception 'The teams must split into equal groups of at least 3' using errcode = '22023';
  end if;

  insert into public.tournament_rounds (tournament_id, round, kind, groups)
  values (p_tournament, p_from + 1, v_kind, case when v_kind = 'groups' then p_groups else 1 end);
  insert into public.tournament_round_teams (tournament_id, round, team_id, group_index, slot)
  select p_tournament, p_from + 1, x.team_id,
    case when v_kind = 'groups' and p_groups = 1 then 0 end,
    case when v_kind = 'knockout' then x.i - 1 end
  from unnest(p_teams) with ordinality as x(team_id, i);
  update public.tournament_teams set eliminated_at = now()
   where tournament_id = p_tournament and eliminated_at is null and not (team_id = any (p_teams));
end $$;
revoke all on function public.advance_tournament_round(uuid, int, uuid[], int) from public, anon;
grant execute on function public.advance_tournament_round(uuid, int, uuid[], int) to authenticated;

create function public.confirm_knockout_winner(p_fixture uuid, p_winner uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.tournament_fixtures; v_loser uuid; v_label text;
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found or f.stage = 'League' then raise exception 'This knockout match could not be found' using errcode = 'P0002'; end if;
  if public.begin_tournament_change(f.tournament_id) is distinct from 'owner' then
    raise exception 'Only the tournament owner can settle a knockout match' using errcode = '42501';
  end if;
  if p_winner is null or (p_winner is distinct from f.home_team_id and p_winner is distinct from f.away_team_id)
     or f.home_team_id is null or f.away_team_id is null then
    raise exception 'The winner must be one of the two teams' using errcode = '22023';
  end if;
  if f.status = 'scheduled' and not exists (select 1 from public.matches where id = f.match_id and status = 'completed') then
    raise exception 'This match has not finished' using errcode = '22023';
  end if;
  v_loser := case when p_winner = f.home_team_id then f.away_team_id else f.home_team_id end;
  v_label := 'Winner of Match ' || f.number;
  if exists (select 1 from public.tournament_fixtures where tournament_id = f.tournament_id and match_id is not null
             and v_label in (home_label, away_label)) then
    raise exception 'The next match has started' using errcode = 'ET004';
  end if;
  update public.tournament_fixtures set home_team_id = p_winner where tournament_id = f.tournament_id and home_label = v_label;
  update public.tournament_fixtures set away_team_id = p_winner where tournament_id = f.tournament_id and away_label = v_label;
  update public.tournament_teams set eliminated_at = case when team_id = v_loser then coalesce(eliminated_at, now()) end
   where tournament_id = f.tournament_id and team_id in (p_winner, v_loser);
end $$;
revoke all on function public.confirm_knockout_winner(uuid, uuid) from public, anon;
grant execute on function public.confirm_knockout_winner(uuid, uuid) to authenticated;

-- Appends matches (numbered after the existing ones) without touching those already scheduled.
create function public.add_tournament_fixtures(p_tournament uuid, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_problem text; v_count int;
begin
  perform public.require_tournament_owner(p_tournament);
  if p is null or jsonb_typeof(p -> 'matches') is distinct from 'array' then
    raise exception 'Send the list of matches' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p -> 'matches');
  if v_count = 0 or v_count + (select count(*) from public.tournament_fixtures where tournament_id = p_tournament) > 1200 then
    raise exception 'A schedule has 1 to 1200 matches' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_to_recordset(p -> 'matches') as x(number int)
             where x.number <= (select coalesce(max(number), 0) from public.tournament_fixtures where tournament_id = p_tournament)) then
    raise exception 'New matches are numbered after the existing ones' using errcode = '22023';
  end if;
  insert into public.tournament_fixtures (tournament_id, number, stage, round, home_team_id, away_team_id, home_label,
    away_label, match_date, start_min)
  select p_tournament, x.number, x.stage, x.round, x.home_team, x.away_team, nullif(btrim(x.home_label), ''),
    nullif(btrim(x.away_label), ''), x.match_date, x.start_min
  from jsonb_to_recordset(p -> 'matches') as x(number int, stage text, round int, home_team uuid, away_team uuid,
    home_label text, away_label text, match_date date, start_min int);

  v_problem := public.tournament_schedule_problem(p_tournament);
  if v_problem is not null then raise exception '%', v_problem using errcode = 'ET006'; end if;

  insert into public.notifications (user_id, kind, title, message, data)
  select distinct m.profile_id, 'system', 'New matches scheduled', format('The next round of %s is scheduled. Check your matches.', t.name),
    jsonb_build_object('tournament_id', p_tournament, 'team_id', m.team_id, 'event', 'schedule_published')
  from jsonb_to_recordset(p -> 'matches') as x(home_team uuid, away_team uuid)
  cross join lateral (values (x.home_team), (x.away_team)) s(team_id)
  join public.team_members m on m.team_id = s.team_id and m.role = 'owner'
  join public.tournaments t on t.id = p_tournament
  where m.profile_id <> (select auth.uid());
exception when check_violation or not_null_violation or unique_violation or invalid_text_representation
  or invalid_datetime_format or datetime_field_overflow or numeric_value_out_of_range or foreign_key_violation then
  raise exception 'The schedule is not valid: %', sqlerrm using errcode = '22023';
end $$;
revoke all on function public.add_tournament_fixtures(uuid, jsonb) from public, anon;
grant execute on function public.add_tournament_fixtures(uuid, jsonb) to authenticated;

-- Same as 20261102192425, with up to 1200 matches.
create or replace function public.publish_tournament_schedule(p_tournament uuid, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_problem text; v_count int;
begin
  perform public.require_tournament_owner(p_tournament);
  if p is null or jsonb_typeof(p) <> 'object' or jsonb_typeof(p -> 'matches') is distinct from 'array'
     or coalesce(p ->> 'mode', '') not in ('auto', 'manual') then
    raise exception 'Send the mode and the list of matches' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p -> 'matches');
  if v_count = 0 or v_count > 1200 then
    raise exception 'A schedule has 1 to 1200 matches' using errcode = '22023';
  end if;
  if exists (select 1 from public.tournament_fixtures where tournament_id = p_tournament and match_id is not null) then
    raise exception 'Matches have started; change them one at a time' using errcode = 'ET004';
  end if;

  delete from public.tournament_fixtures where tournament_id = p_tournament;
  insert into public.tournament_fixtures (tournament_id, number, stage, round, home_team_id, away_team_id, home_label,
    away_label, match_date, start_min)
  select p_tournament, x.number, x.stage, x.round, x.home_team, x.away_team, nullif(btrim(x.home_label), ''),
    nullif(btrim(x.away_label), ''), x.match_date, x.start_min
  from jsonb_to_recordset(p -> 'matches') as x(number int, stage text, round int, home_team uuid, away_team uuid,
    home_label text, away_label text, match_date date, start_min int);

  v_problem := public.tournament_schedule_problem(p_tournament);
  if v_problem is not null then raise exception '%', v_problem using errcode = 'ET006'; end if;

  update public.tournaments set schedule_mode = p ->> 'mode', slots_per_day = (p ->> 'per_day')::smallint,
    first_start_min = (p ->> 'first_start_min')::smallint, schedule_published_at = now()
   where id = p_tournament;

  insert into public.notifications (user_id, kind, title, message, data)
  select m.profile_id, 'system', 'Schedule published', format('The schedule for %s is out. Check your matches.', t.name),
    jsonb_build_object('tournament_id', p_tournament, 'team_id', m.team_id, 'event', 'schedule_published')
  from public.tournament_teams tt
  join public.team_members m on m.team_id = tt.team_id and m.role = 'owner'
  join public.tournaments t on t.id = tt.tournament_id
  where tt.tournament_id = p_tournament and m.profile_id <> (select auth.uid());
exception when check_violation or not_null_violation or unique_violation or invalid_text_representation
  or invalid_datetime_format or datetime_field_overflow or numeric_value_out_of_range or foreign_key_violation then
  raise exception 'The schedule is not valid: %', sqlerrm using errcode = '22023';
end $$;

-- Standings per group round: round 0 holds every entered team; later group rounds hold their own teams.
create or replace view public.tournament_standings with (security_invoker = true) as
with results as (
  select f.tournament_id, f.round, f.home_team_id as team_id,
    m.team_a_runs as runs_for,
    case when coalesce(m.team_a_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_a_balls end as balls_for,
    m.team_b_runs as runs_against,
    case when coalesce(m.team_b_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_b_balls end as balls_against,
    case when m.result_type = 'tie' then 'tied' when m.winner_side = 'a' then 'won' else 'lost' end as outcome
  from public.tournament_fixtures f
  join public.matches m on m.id = f.match_id
  join public.tournaments t on t.id = f.tournament_id
  where f.stage = 'League' and f.status = 'scheduled' and m.status = 'completed' and f.home_team_id is not null
  union all
  select f.tournament_id, f.round, f.away_team_id,
    m.team_b_runs,
    case when coalesce(m.team_b_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_b_balls end,
    m.team_a_runs,
    case when coalesce(m.team_a_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_a_balls end,
    case when m.result_type = 'tie' then 'tied' when m.winner_side = 'b' then 'won' else 'lost' end
  from public.tournament_fixtures f
  join public.matches m on m.id = f.match_id
  join public.tournaments t on t.id = f.tournament_id
  where f.stage = 'League' and f.status = 'scheduled' and m.status = 'completed' and f.away_team_id is not null
), members as (
  select tournament_id, team_id, 0 as round from public.tournament_teams
  union all
  select rt.tournament_id, rt.team_id, rt.round::int from public.tournament_round_teams rt
  join public.tournament_rounds r on r.tournament_id = rt.tournament_id and r.round = rt.round and r.kind = 'groups'
), totals as (
  select mb.tournament_id, mb.team_id, mb.round,
    count(r.outcome)::int as played,
    count(*) filter (where r.outcome = 'won')::int as won,
    count(*) filter (where r.outcome = 'lost')::int as lost,
    count(*) filter (where r.outcome = 'tied')::int as tied,
    coalesce(sum(r.runs_for), 0)::int as runs_for,
    coalesce(sum(r.balls_for), 0)::int as balls_for,
    coalesce(sum(r.runs_against), 0)::int as runs_against,
    coalesce(sum(r.balls_against), 0)::int as balls_against
  from members mb
  left join results r on r.tournament_id = mb.tournament_id and r.team_id = mb.team_id and r.round = mb.round
  group by mb.tournament_id, mb.team_id, mb.round
)
select s.tournament_id, s.team_id, tm.name, tm.short_name, tm.tone,
  s.played, s.won, s.lost, s.tied, (s.won * 2 + s.tied) as points,
  s.runs_for, s.balls_for, s.runs_against, s.balls_against,
  case when s.balls_for > 0 and s.balls_against > 0
    then round(s.runs_for * 6.0 / s.balls_for - s.runs_against * 6.0 / s.balls_against, 3) end as nrr,
  s.round
from totals s
join public.teams tm on tm.id = s.team_id;
