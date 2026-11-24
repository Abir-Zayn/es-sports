-- Lets the owner reschedule after knockout results come in. `tournament_schedule_problem` (run by every reschedule,
-- publish and tournament edit) refused two valid states:
-- 1. A side holding both its team and its placeholder. confirm_knockout_winner fills the team in and keeps the
--    "Winner of Match N" label, so after the first knockout result every schedule change in the tournament failed.
--    A side is now only wrong when it has neither.
-- 2. A match next to one already played. The "two matches on the ground" check counted finished matches; a pair
--    is now skipped when either fixture's match is completed. A team's per-day limit still counts them.
-- Otherwise identical to the live definition (read before writing this).

create or replace function public.tournament_schedule_problem(p_tournament uuid)
returns text
language plpgsql
stable security definer
set search_path to ''
as $function$
declare t public.tournaments; v_slot int;
begin
  select * into t from public.tournaments where id = p_tournament;
  v_slot := public.fixture_slot_minutes_for_overs(t.overs);
  if exists (select 1 from public.tournament_fixtures f where f.tournament_id = p_tournament and f.status = 'scheduled'
             and (f.match_date not between t.start_date and t.end_date or f.start_min + v_slot > 23 * 60)) then
    return 'Every match must be on a tournament day and finish by 11:00 PM';
  end if;
  -- Cancelled fixtures are history: their team may have left since, so only scheduled ones are checked.
  -- A side needs a team, a placeholder, or both: confirm_knockout_winner fills the team in and keeps the
  -- "Winner of Match N" label, which it uses to find the slot again.
  if exists (select 1 from public.tournament_fixtures f where f.tournament_id = p_tournament and f.status = 'scheduled'
             and ((f.home_team_id is null and f.home_label is null) or (f.away_team_id is null and f.away_label is null))) then
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
  -- A completed match has left the ground, so it cannot clash with a match moved next to it.
  if exists (select 1 from public.tournament_fixtures a join public.tournament_fixtures b
               on b.tournament_id = a.tournament_id and b.match_date = a.match_date and b.id > a.id
             where a.tournament_id = p_tournament and a.status = 'scheduled' and b.status = 'scheduled'
               and abs(a.start_min - b.start_min) < v_slot
               and not exists (select 1 from public.matches m where m.id in (a.match_id, b.match_id) and m.status = 'completed')) then
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
end $function$;
