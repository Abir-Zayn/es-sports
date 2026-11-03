-- Any number of overs from 4 to 50 for a tournament, instead of only T10, T20 and ODI.
--
-- * `tournaments.overs` (4 to 50) is the setting. Existing rows are filled from `match_format`: T10 10, T20 20, ODI 50.
-- * `match_format` stays as a label the trigger keeps in step: `T<overs>`, or `ODI` for 50. An older app that still
--   sends only `match_format` (T10, T20 or ODI) keeps working: the trigger works out the overs from it.
-- * `create_tournament` now also reads `overs`. An out-of-range value is a check violation, reported as 22023.
-- * The schedule's ground time per match comes from the overs: 12 minutes an over (both innings and the change-over),
--   rounded up to 30 minutes, between 1 and 8 hours. T10 2 h, T20 4 h and ODI 8 h are as before.
-- * `start_tournament_fixture` takes the match's overs from the tournament.

alter table public.tournaments add column overs smallint;
update public.tournaments set overs = case match_format when 'T10' then 10 when 'ODI' then 50 else 20 end where overs is null;
alter table public.tournaments alter column overs set not null,
  add constraint tournaments_overs_check check (overs between 4 and 50),
  drop constraint tournaments_match_format_check,
  add constraint tournaments_match_format_check check (match_format ~ '^(T([4-9]|[1-4][0-9])|ODI)$');

create function public.tournaments_overs_label() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.overs is null then
    new.overs := case new.match_format when 'T10' then 10 when 'T20' then 20 when 'ODI' then 50 end;
  end if;
  new.match_format := case when new.overs = 50 then 'ODI' else 'T' || new.overs end;
  return new;
end $$;
create trigger tournaments_overs_label before insert or update of overs, match_format on public.tournaments
  for each row execute function public.tournaments_overs_label();

-- Ground time for one match of this many overs, in minutes (the app's `slotMinutes`).
create function public.fixture_slot_minutes_for_overs(p_overs int) returns int
language sql immutable set search_path = '' as $$
  select least(480, greatest(60, (ceil(p_overs * 12 / 30.0) * 30)::int));
$$;

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
  if exists (select 1 from public.tournament_fixtures a join public.tournament_fixtures b
               on b.tournament_id = a.tournament_id and b.match_date = a.match_date and b.id > a.id
             where a.tournament_id = p_tournament and a.status = 'scheduled' and b.status = 'scheduled'
               and array_remove(array[a.home_team_id, a.away_team_id], null) && array[b.home_team_id, b.away_team_id]) then
    return 'A team plays twice on the same day';
  end if;
  return null;
end $$;
revoke all on function public.tournament_schedule_problem(uuid) from public, anon, authenticated;
drop function public.fixture_slot_minutes(text);

create or replace function public.create_tournament(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_owner uuid;
  t public.tournaments;
begin
  if v_uid is null then
    raise exception 'Sign in to create a tournament' using errcode = '42501';
  end if;
  if p is null or jsonb_typeof(p) <> 'object'
    or coalesce(p ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Tournament id must be a uuid' using errcode = '22023';
  end if;
  v_id := (p ->> 'id')::uuid;
  perform pg_advisory_xact_lock(hashtextextended('create_tournament:' || v_id::text, 0));
  select owner_id into v_owner from public.tournaments where id = v_id;
  if found then
    if v_owner is distinct from v_uid then
      raise exception 'This tournament id is already used' using errcode = '23505';
    end if;
    return v_id;
  end if;
  t := jsonb_populate_record(null::public.tournaments, (
    select coalesce(jsonb_object_agg(e.key, case when e.value = '""'::jsonb then 'null'::jsonb else e.value end), '{}'::jsonb)
    from jsonb_each(p) e
    where e.key in ('name', 'city', 'venue', 'start_date', 'end_date', 'match_format', 'overs', 'competition', 'teams_planned',
      'ball', 'side_format', 'players_per_side', 'min_squad', 'max_squad', 'registration_opens', 'registration_deadline')
  ));
  -- One day of slack for callers whose local date is behind the server's.
  if t.start_date < current_date - 1 then
    raise exception 'Choose today or a future start date' using errcode = '22023';
  end if;
  insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, overs, competition,
    teams_planned, ball, side_format, players_per_side, min_squad, max_squad, registration_opens, registration_deadline)
  values (v_id, v_uid, btrim(t.name), btrim(t.city), btrim(t.venue), t.start_date, t.end_date, t.match_format, t.overs,
    t.competition, t.teams_planned, t.ball, t.side_format, t.players_per_side, t.min_squad, t.max_squad,
    t.registration_opens, t.registration_deadline);
  insert into public.tournament_staff (tournament_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
exception when check_violation or not_null_violation or invalid_datetime_format or datetime_field_overflow
  or invalid_text_representation or numeric_value_out_of_range then
  raise exception 'Tournament details are not valid: %', sqlerrm using errcode = '22023';
end;
$$;

create or replace function public.start_tournament_fixture(p_fixture uuid, p_scorer uuid, p_home_xi uuid[], p_away_xi uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  f public.tournament_fixtures; t public.tournaments; a public.teams; b public.teams;
  v_role text; v_match uuid := gen_random_uuid(); v_team uuid; v_players uuid[];
begin
  select * into f from public.tournament_fixtures where id = p_fixture;
  if not found then raise exception 'Fixture not found' using errcode = 'P0002'; end if;
  v_role := public.begin_tournament_change(f.tournament_id);
  if v_role is null or v_role not in ('owner', 'moderator') then
    raise exception 'Only tournament staff can start a match' using errcode = '42501';
  end if;
  select * into f from public.tournament_fixtures where id = p_fixture for update;
  if not found then raise exception 'Fixture not found' using errcode = 'P0002'; end if;
  if f.match_id is not null then return f.match_id; end if;
  if f.status <> 'scheduled' then raise exception 'Fixture is cancelled' using errcode = '22023'; end if;
  if f.home_team_id is null or f.away_team_id is null then
    raise exception 'Both teams must be known' using errcode = 'ET007';
  end if;
  -- Other team changes lock their team row; lock in stable order before inspecting availability.
  perform 1 from public.teams where id in (f.home_team_id, f.away_team_id) order by id for update;
  select * into t from public.tournaments where id = f.tournament_id;
  select * into a from public.teams where id = f.home_team_id;
  select * into b from public.teams where id = f.away_team_id;
  if p_scorer is null or not exists (select 1 from public.profiles where id = p_scorer) then
    raise exception 'Choose a scorer' using errcode = '22023';
  end if;
  for v_team, v_players in select f.home_team_id, p_home_xi union all select f.away_team_id, p_away_xi loop
    if v_players is null or cardinality(v_players) <> t.players_per_side
      or array_position(v_players, null) is not null
      or cardinality(v_players) <> (select count(distinct id) from unnest(v_players) id)
      or exists (select 1 from unnest(v_players) id
        left join public.tournament_squads s on s.tournament_id = f.tournament_id and s.team_id = v_team and s.profile_id = id
        left join public.team_members m on m.team_id = v_team and m.profile_id = id
        where s.profile_id is null or m.availability is distinct from 'available') then
      raise exception 'Choose the required number of available squad players for each team' using errcode = '22023';
    end if;
  end loop;
  insert into public.matches (id, tournament_id, fixture_ref, created_by, title,
    team_a_name, team_a_short, team_a_tone, team_a_image_url,
    team_b_name, team_b_short, team_b_tone, team_b_image_url, overs_limit, status)
  values (v_match, f.tournament_id, 'tournament-' || f.id, (select auth.uid()),
    'Match ' || f.number || ' · ' || f.stage,
    a.name, a.short_name, a.tone, a.logo_url, b.name, b.short_name, b.tone, b.logo_url,
    t.overs, 'scheduled');
  insert into public.match_players (match_id, key, side, name, profile_id, in_playing_xi, sort_order)
  select v_match, x.profile_id::text, x.side, coalesce(nullif(p.full_name, ''), 'Player'), x.profile_id, true, (x.n - 1)::smallint
  from (select id as profile_id, 'a'::text as side, n from unnest(p_home_xi) with ordinality as h(id, n)
        union all select id, 'b', n from unnest(p_away_xi) with ordinality as aw(id, n)) x
  join public.profiles p on p.id = x.profile_id;
  insert into public.match_scorers (match_id, user_id) values (v_match, p_scorer);
  update public.tournament_fixtures set match_id = v_match where id = f.id;
  -- Knockout advancement belongs after the match-completion transaction, in a later feature.
  return v_match;
end $$;
revoke all on function public.start_tournament_fixture(uuid, uuid, uuid[], uuid[]) from public, anon;
grant execute on function public.start_tournament_fixture(uuid, uuid, uuid[], uuid[]) to authenticated;
