-- Writes for tournament fixtures (see 20261103100000 for the table, the rules and the error codes).

-- Replaces the whole schedule. `p` is
--   { "mode": "auto" | "manual", "per_day": 1-4, "first_start_min": 0-1439,
--     "matches": [{ "number", "stage", "round", "home_team" | "home_label", "away_team" | "away_label",
--                   "match_date": "YYYY-MM-DD", "start_min" }] }
-- Repeating the same call gives the same schedule. Team owners are told it was published.
create function public.publish_tournament_schedule(p_tournament uuid, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_problem text; v_count int;
begin
  perform public.require_tournament_owner(p_tournament);
  if p is null or jsonb_typeof(p) <> 'object' or jsonb_typeof(p -> 'matches') is distinct from 'array'
     or coalesce(p ->> 'mode', '') not in ('auto', 'manual') then
    raise exception 'Send the mode and the list of matches' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p -> 'matches');
  if v_count = 0 or v_count > 200 then
    raise exception 'A schedule has 1 to 200 matches' using errcode = '22023';
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

-- Moves one fixture that has not started. The rest of the schedule must still fit around it.
create function public.reschedule_tournament_fixture(p_fixture uuid, p_date date, p_start_min int) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.tournament_fixtures; v_problem text;
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'This match could not be found' using errcode = 'P0002'; end if;
  perform public.require_tournament_owner(f.tournament_id);
  select * into f from public.tournament_fixtures where id = p_fixture for update;
  if f.match_id is not null then raise exception 'This match has started' using errcode = 'ET004'; end if;
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

-- Cancels one fixture that has not started, with the reason the teams are shown. A repeat is a no-op.
create function public.cancel_tournament_fixture(p_fixture uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.tournament_fixtures; v_reason text := btrim(coalesce(p_reason, ''));
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'This match could not be found' using errcode = 'P0002'; end if;
  perform public.require_tournament_owner(f.tournament_id);
  select * into f from public.tournament_fixtures where id = p_fixture for update;
  if f.status = 'cancelled' then return; end if;
  if f.match_id is not null then raise exception 'This match has started' using errcode = 'ET004'; end if;
  if char_length(v_reason) not between 3 and 200 then
    raise exception 'Give a reason of 3 to 200 characters' using errcode = '22023';
  end if;
  update public.tournament_fixtures set status = 'cancelled', cancel_reason = v_reason, cancelled_at = now()
   where id = p_fixture;
  perform public.notify_fixture_teams(p_fixture, 'Match cancelled', format('Match %s was cancelled: %s', f.number, v_reason),
    'fixture_cancelled');
end $$;

-- Same as 20261103000000, plus: a team with scheduled fixtures cannot leave (ET005).
create or replace function public.remove_tournament_team(p_tournament uuid, p_team uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
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
  update public.invitations set status = 'cancelled', resolved_at = now()
   where kind = 'team_owner' and tournament_id = p_tournament and team_id = p_team and status = 'pending';
  delete from public.tournament_teams where tournament_id = p_tournament and team_id = p_team;
  if not exists (select 1 from public.team_members where team_id = p_team)
     and not exists (select 1 from public.tournament_teams where team_id = p_team) then
    delete from public.teams where id = p_team;
    return;
  end if;
  select profile_id into v_owner from public.team_members where team_id = p_team and role = 'owner';
  if v_owner is not null and v_owner <> v_uid then
    insert into public.notifications (user_id, kind, title, message, data)
    values (v_owner, 'system', 'Team removed from tournament', 'The organiser removed your team from their tournament.',
      jsonb_build_object('tournament_id', p_tournament, 'team_id', p_team, 'event', 'team_removed'));
  end if;
end $$;

revoke all on function public.publish_tournament_schedule(uuid, jsonb), public.reschedule_tournament_fixture(uuid, date, int),
  public.cancel_tournament_fixture(uuid, text) from public, anon;
grant execute on function public.publish_tournament_schedule(uuid, jsonb), public.reschedule_tournament_fixture(uuid, date, int),
  public.cancel_tournament_fixture(uuid, text) to authenticated;

revoke all on public.tournament_fixtures from anon;
revoke insert, update, delete, truncate on public.tournament_fixtures from authenticated;
grant select on public.tournament_fixtures to authenticated;
alter table public.tournament_fixtures enable row level security;
create policy "tournament_fixtures: signed-in users can read"
  on public.tournament_fixtures for select to authenticated using (true);
