-- The owner can move a fixture until its match is over. Before this, any fixture linked to a match (Start match
-- pressed, even with no ball bowled) was refused with ET004, so a match set up early or interrupted could not get
-- a new time. Cancelling a started fixture is still refused. Same as the live definition otherwise.
create or replace function public.reschedule_tournament_fixture(p_fixture uuid, p_date date, p_start_min int) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.tournament_fixtures; v_problem text;
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'This match could not be found' using errcode = 'P0002'; end if;
  perform public.require_tournament_owner(f.tournament_id);
  select * into f from public.tournament_fixtures where id = p_fixture for update;
  if f.match_id is not null and exists (select 1 from public.matches m where m.id = f.match_id and m.status = 'completed') then
    raise exception 'This match is over' using errcode = 'ET004';
  end if;
  if f.status <> 'scheduled' then raise exception 'A cancelled match cannot be moved' using errcode = '22023'; end if;
  if p_date is null or p_start_min is null or p_start_min not between 0 and 1439 then
    raise exception 'Choose a day and a start time' using errcode = '22023';
  end if;
  if f.match_date = p_date and f.start_min = p_start_min then return; end if;

  update public.tournament_fixtures set match_date = p_date, start_min = p_start_min where id = p_fixture;
  v_problem := public.tournament_schedule_problem(f.tournament_id);
  if v_problem is not null then raise exception '%', v_problem using errcode = 'ET006'; end if;
  perform public.notify_fixture_teams(p_fixture, 'Match moved',
    format('Match %s is now on %s at %s.', f.number, to_char(p_date, 'Dy DD Mon'),
      to_char(time '00:00' + make_interval(mins => p_start_min), 'FMHH12:MI AM')), 'fixture_moved');
end $$;
