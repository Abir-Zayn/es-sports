-- Tournament fixtures and the owner's schedule controls (workfile items 7 and 8).
--
-- * Fixtures live in their own table, not as `matches` rows: a knockout fixture may not know its teams yet
--   ("Winner of Match 9"), and `matches` needs both team names to exist. `match_id` links the fixture to its match
--   once scoring starts (roadmap step 17); `matches` itself is not changed here.
-- * A side is either an entered team (`*_team_id`) or a placeholder label (`*_label`), never both.
-- * Times are a calendar date plus minutes after midnight at the ground, as the schedule builder uses them, so no
--   time zone can move a match to another day.
-- * `publish_tournament_schedule` replaces the whole schedule in one call (auto drawn or built by hand). It is
--   refused once any fixture has a match (ET004): from then on the owner changes matches one at a time.
-- * `reschedule_tournament_fixture` moves one fixture; `cancel_tournament_fixture` cancels it with a reason. Both
--   notify the owners of the teams playing. Only the tournament owner may change the schedule.
-- * Every write re-checks the whole schedule (`tournament_schedule_problem`): dates inside the tournament, a match
--   finished by 11 PM, no two matches on the ground at once, no team twice a day.
-- * `remove_tournament_team` (20261103000000) is redefined to refuse a team with scheduled fixtures (ET005).
-- * Error codes: 42501 not allowed, 22023 invalid input, P0002 not found, ET004 match already started,
--   ET005 team still has scheduled fixtures, ET006 schedule clash.

alter table public.tournaments
  add column schedule_mode text check (schedule_mode in ('auto', 'manual')),
  add column slots_per_day smallint check (slots_per_day between 1 and 4),
  add column first_start_min smallint check (first_start_min between 0 and 1439),
  add column schedule_published_at timestamptz;

create table public.tournament_fixtures (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  number smallint not null check (number between 1 and 200),
  stage text not null check (stage in ('League', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final')),
  round smallint not null check (round between 0 and 10),
  home_team_id uuid references public.teams (id) on delete set null,
  away_team_id uuid references public.teams (id) on delete set null,
  home_label text check (char_length(home_label) between 1 and 60),
  away_label text check (char_length(away_label) between 1 and 60),
  match_date date not null,
  start_min smallint not null check (start_min between 0 and 1439),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  cancel_reason text check (char_length(cancel_reason) between 3 and 200),
  cancelled_at timestamptz,
  match_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, number),
  check (home_team_id is null or home_team_id is distinct from away_team_id),
  check ((status = 'cancelled') = (cancelled_at is not null)),
  check ((status = 'cancelled') = (cancel_reason is not null))
);

create index tournament_fixtures_day_idx on public.tournament_fixtures (tournament_id, match_date, start_min);
create index tournament_fixtures_home_idx on public.tournament_fixtures (home_team_id);
create index tournament_fixtures_away_idx on public.tournament_fixtures (away_team_id);
create index tournament_fixtures_match_idx on public.tournament_fixtures (match_id);

create trigger tournament_fixtures_set_updated_at before update on public.tournament_fixtures
  for each row execute function public.set_updated_at();

-- Minutes kept on the ground for one match: play plus the change-over (the app's `slotMinutes`).
create function public.fixture_slot_minutes(p_format text) returns int
language sql immutable set search_path = '' as $$
  select case p_format when 'T10' then 120 when 'ODI' then 480 else 240 end;
$$;

-- Why the tournament's scheduled fixtures do not fit together, or null when they do.
create function public.tournament_schedule_problem(p_tournament uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare t public.tournaments; v_slot int;
begin
  select * into t from public.tournaments where id = p_tournament;
  v_slot := public.fixture_slot_minutes(t.match_format);
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
  if exists (select 1 from public.tournament_fixtures a join public.tournament_fixtures b
               on b.tournament_id = a.tournament_id and b.match_date = a.match_date and b.id > a.id
             where a.tournament_id = p_tournament and a.status = 'scheduled' and b.status = 'scheduled'
               and array_remove(array[a.home_team_id, a.away_team_id], null) && array[b.home_team_id, b.away_team_id]) then
    return 'A team plays twice on the same day';
  end if;
  return null;
end $$;
revoke all on function public.tournament_schedule_problem(uuid) from public, anon, authenticated;

-- Tells the owners of both teams (but not the caller) what happened to a fixture.
create function public.notify_fixture_teams(p_fixture uuid, p_title text, p_message text, p_event text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, message, data)
  select m.profile_id, 'system', p_title, p_message,
    jsonb_build_object('tournament_id', f.tournament_id, 'fixture_id', f.id, 'team_id', m.team_id, 'event', p_event)
  from public.tournament_fixtures f
  join public.team_members m on m.team_id in (f.home_team_id, f.away_team_id) and m.role = 'owner'
  where f.id = p_fixture and m.profile_id is distinct from (select auth.uid());
$$;
revoke all on function public.notify_fixture_teams(uuid, text, text, text) from public, anon, authenticated;

create function public.require_tournament_owner(p_tournament uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can change the schedule' using errcode = '42501';
  end if;
end $$;
revoke all on function public.require_tournament_owner(uuid) from public, anon, authenticated;
