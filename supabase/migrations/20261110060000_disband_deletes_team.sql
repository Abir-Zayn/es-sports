-- Disbanding a team deletes it (and its squad and memberships): teams have no owner and live only inside a tournament.
-- Body of 20261102192425 `remove_tournament_team` without the owner handling. The owner-only rule and the ET005 guard
-- (a team with scheduled matches cannot go) are unchanged.
create or replace function public.remove_tournament_team(p_tournament uuid, p_team uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can remove a team' using errcode = '42501';
  end if;
  if p_team is null then raise exception 'Choose a team to remove' using errcode = '22023'; end if;
  perform 1 from public.teams where id = p_team for update;
  if not exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team) then
    return;
  end if;
  if exists (select 1 from public.tournament_fixtures where tournament_id = p_tournament and status = 'scheduled'
             and p_team in (home_team_id, away_team_id)) then
    raise exception 'This team has scheduled matches. Cancel them or redraw the schedule first' using errcode = 'ET005';
  end if;
  delete from public.tournament_teams where tournament_id = p_tournament and team_id = p_team;
  if not exists (select 1 from public.tournament_teams where team_id = p_team) then
    delete from public.teams where id = p_team;
  end if;
end $$;
