-- Tournament groups.
--
-- * `groups_planned` (1 to 8, default 1 = one round robin). Every group holds the same number of teams, at least 3:
--   teams_planned must divide by it and be at least 3 per group. Teams now range 4 to 48 (new tournaments 6 to 48;
--   4 stays valid so tournaments already published still load).
-- * `tournament_teams.group_index` (0 = Group A … 7 = Group H) is set by the owner's random draw, null until then.
--   Adding or removing a team clears the draw, since the groups no longer add up.
-- * `advance_per_group`: how many teams of each group go to the next stage. The owner sets it with the draw.
-- * `draw_tournament_groups` draws (or redraws) at random; `swap_tournament_group_teams` swaps two teams in different
--   groups. Both need every planned team entered (ET015) and refuse once any match of the tournament has started (ET016).
-- * Error codes: 42501 not the owner, 22023 invalid input, P0002 team not in this tournament.

do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.tournaments'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) like '%teams_planned%' loop
    execute format('alter table public.tournaments drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.tournaments
  add column groups_planned int not null default 1 check (groups_planned between 1 and 8),
  add column advance_per_group int check (advance_per_group >= 1);
alter table public.tournaments add constraint tournaments_teams_planned_check check (
  teams_planned between 4 and 48
  and teams_planned % groups_planned = 0
  and (groups_planned = 1 or teams_planned >= 3 * groups_planned));

alter table public.tournament_teams add column group_index smallint check (group_index between 0 and 7);

create function public.clear_tournament_group_draw() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.tournament_teams set group_index = null
   where tournament_id = coalesce(new.tournament_id, old.tournament_id) and group_index is not null;
  return null;
end $$;
revoke all on function public.clear_tournament_group_draw() from public, anon, authenticated;
create trigger tournament_teams_clear_draw after insert or delete on public.tournament_teams
  for each row execute function public.clear_tournament_group_draw();

-- Owner check plus the shared draw/swap preconditions. Returns the tournament row.
create function public.begin_group_change(p_tournament uuid) returns public.tournaments
language plpgsql security definer set search_path = '' as $$
declare t public.tournaments;
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can change the groups' using errcode = '42501';
  end if;
  select * into t from public.tournaments where id = p_tournament for update;
  if t.groups_planned < 2 then raise exception 'This tournament has no groups' using errcode = '22023'; end if;
  if (select count(*) from public.tournament_teams where tournament_id = p_tournament) <> t.teams_planned then
    raise exception 'Every team must join before the groups are drawn' using errcode = 'ET015';
  end if;
  if exists (select 1 from public.tournament_fixtures where tournament_id = p_tournament and match_id is not null) then
    raise exception 'A match has started, so the groups are locked' using errcode = 'ET016';
  end if;
  return t;
end $$;
revoke all on function public.begin_group_change(uuid) from public, anon, authenticated;

create function public.draw_tournament_groups(p_tournament uuid, p_advance int) returns void
language plpgsql security definer set search_path = '' as $$
declare t public.tournaments;
begin
  t := public.begin_group_change(p_tournament);
  if p_advance is null or p_advance not between 1 and t.teams_planned / t.groups_planned then
    raise exception 'Choose how many teams of each group go through' using errcode = '22023';
  end if;
  update public.tournaments set advance_per_group = p_advance where id = p_tournament;
  update public.tournament_teams tt set group_index = d.g
    from (select team_id, ((row_number() over (order by random())) - 1) % t.groups_planned as g
            from public.tournament_teams where tournament_id = p_tournament) d
   where tt.tournament_id = p_tournament and tt.team_id = d.team_id;
end $$;
revoke all on function public.draw_tournament_groups(uuid, int) from public, anon;
grant execute on function public.draw_tournament_groups(uuid, int) to authenticated;

create function public.swap_tournament_group_teams(p_tournament uuid, p_team_a uuid, p_team_b uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_a smallint; v_b smallint;
begin
  perform public.begin_group_change(p_tournament);
  select group_index into v_a from public.tournament_teams where tournament_id = p_tournament and team_id = p_team_a;
  select group_index into v_b from public.tournament_teams where tournament_id = p_tournament and team_id = p_team_b;
  if v_a is null or v_b is null then raise exception 'Both teams must be in a drawn group' using errcode = 'P0002'; end if;
  if v_a = v_b then raise exception 'Pick teams from two different groups' using errcode = '22023'; end if;
  update public.tournament_teams set group_index = case when team_id = p_team_a then v_b else v_a end
   where tournament_id = p_tournament and team_id in (p_team_a, p_team_b);
end $$;
revoke all on function public.swap_tournament_group_teams(uuid, uuid, uuid) from public, anon;
grant execute on function public.swap_tournament_group_teams(uuid, uuid, uuid) to authenticated;

-- create_tournament now also reads `groups_planned`.
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
      'groups_planned', 'ball', 'side_format', 'players_per_side', 'min_squad', 'max_squad', 'registration_opens', 'registration_deadline')
  ));
  -- One day of slack for callers whose local date is behind the server's.
  if t.start_date < current_date - 1 then
    raise exception 'Choose today or a future start date' using errcode = '22023';
  end if;
  insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, overs, competition,
    teams_planned, groups_planned, ball, side_format, players_per_side, min_squad, max_squad, registration_opens, registration_deadline)
  values (v_id, v_uid, btrim(t.name), btrim(t.city), btrim(t.venue), t.start_date, t.end_date, t.match_format, t.overs,
    t.competition, t.teams_planned, coalesce(t.groups_planned, 1), t.ball, t.side_format, t.players_per_side, t.min_squad, t.max_squad,
    t.registration_opens, t.registration_deadline);
  insert into public.tournament_staff (tournament_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
exception when check_violation or not_null_violation or invalid_datetime_format or datetime_field_overflow
  or invalid_text_representation or numeric_value_out_of_range then
  raise exception 'Tournament details are not valid: %', sqlerrm using errcode = '22023';
end;
$$;
