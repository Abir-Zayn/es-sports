-- Allow each team to play up to 3 scheduled matches in a single day instead of at most 1.

create or replace function public.tournament_schedule_problem(p_tournament uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare t public.tournaments; v_slot int;
begin
  select * into t from public.tournaments where id = p_tournament;
  v_slot := public.fixture_slot_minutes_for_overs(t.overs);
  if exists (select 1 from public.tournament_fixtures f where f.tournament_id = p_tournament and f.status = 'scheduled'
             and (f.match_date not between t.start_date and t.end_date or f.start_min + v_slot > 23 * 60)) then
    return 'Every match must be on a tournament day and finish by 11:00 PM';
  end if;
  -- Cancelled fixtures are history: their team may have left since, so only scheduled ones are checked.
  if exists (select 1 from public.tournament_fixtures f where f.tournament_id = p_tournament and f.status = 'scheduled'
             and ((f.home_team_id is null) = (f.home_label is null) or (f.away_team_id is null) = (f.away_label is null))) then
    return 'Each side is a team or a placeholder';
  end if;
  if exists (select 1 from public.tournament_fixtures f where f.tournament_id = p_tournament and f.status = 'scheduled'
             and not exists (select 1 from public.tournament_teams tt where tt.tournament_id = p_tournament and tt.team_id = f.home_team_id)
             and f.home_team_id is not null)
     or exists (select 1 from public.tournament_fixtures f where f.tournament_id = p_tournament and f.status = 'scheduled'
             and not exists (select 1 from public.tournament_teams tt where tt.tournament_id = p_tournament and tt.team_id = f.away_team_id)
             and f.away_team_id is not null) then
    return 'Every team in the schedule must be entered in the tournament';
  end if;
  if exists (select 1 from public.tournament_fixtures a join public.tournament_fixtures b
               on b.tournament_id = a.tournament_id and b.match_date = a.match_date and b.id > a.id
             where a.tournament_id = p_tournament and a.status = 'scheduled' and b.status = 'scheduled'
               and abs(a.start_min - b.start_min) < v_slot) then
    return 'Two matches are on the ground at the same time';
  end if;
  if exists (
    select 1
    from (
      select f.match_date, team_id
      from public.tournament_fixtures f
      cross join lateral unnest(array_remove(array[f.home_team_id, f.away_team_id], null)) as team_id
      where f.tournament_id = p_tournament and f.status = 'scheduled'
      group by f.match_date, team_id
      having count(*) > 3
    ) over_limit
  ) then
    return 'A team plays more than 3 matches on the same day';
  end if;
  return null;
end $$;
revoke all on function public.tournament_schedule_problem(uuid) from public, anon, authenticated;
