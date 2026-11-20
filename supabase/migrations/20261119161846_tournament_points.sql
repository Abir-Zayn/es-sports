create index if not exists tournament_round_teams_team_id_idx on public.tournament_round_teams (team_id);

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
  s.played, s.won, s.lost, s.tied, (s.won * 3 + s.tied - s.lost * 3) as points,
  s.runs_for, s.balls_for, s.runs_against, s.balls_against,
  case when s.balls_for > 0 and s.balls_against > 0
    then round(s.runs_for * 6.0 / s.balls_for - s.runs_against * 6.0 / s.balls_against, 3) end as nrr,
  s.round,
  tm.logo_url
from totals s
join public.teams tm on tm.id = s.team_id;

revoke all on public.tournament_standings from public, anon;
grant select on public.tournament_standings to authenticated;

create or replace function public.advance_tournament_round(p_tournament uuid, p_from int, p_teams uuid[], p_groups int) returns void
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
