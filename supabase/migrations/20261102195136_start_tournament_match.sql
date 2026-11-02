-- Tournament fixtures retain their local date and start minute; no time zone is stored, so scheduled_at
-- remains null instead of silently treating the ground's local time as UTC.
alter table public.matches add constraint matches_tournament_id_fkey
  foreign key (tournament_id) references public.tournaments (id) on delete set null not valid;
alter table public.matches validate constraint matches_tournament_id_fkey;

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
    'Match ' || f.number || ' ? ' || f.stage,
    a.name, a.short_name, a.tone, a.logo_url, b.name, b.short_name, b.tone, b.logo_url,
    case t.match_format when 'T10' then 10 when 'ODI' then 50 else 20 end, 'scheduled');
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

create or replace function public.can_score_match(p_match uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case
      when (m.fixture_ref like 'friendly-%' or m.fixture_ref like 'tournament-%') and exists (select 1 from public.match_scorers s where s.match_id = m.id)
        then exists (select 1 from public.match_scorers s where s.match_id = m.id and s.user_id = (select auth.uid()))
      else m.created_by = (select auth.uid()) or exists (
        select 1 from public.match_scorers s where s.match_id = m.id and s.user_id = (select auth.uid())
      )
    end from public.matches m where m.id = p_match
  ), false);
$$;

create or replace function public.check_friendly_scorer() returns trigger
language plpgsql security definer set search_path = '' as $$
declare ref text;
begin
  select fixture_ref into ref from public.matches where id = new.match_id for update;
  if (ref like 'friendly-%' or ref like 'tournament-%') and exists (
    select 1 from public.match_scorers where match_id = new.match_id and user_id <> new.user_id
  ) then
    raise exception 'A friendly match can have only one assigned scorer';
  end if;
  return new;
end;
$$;

drop policy "match_scorers: creator can add" on public.match_scorers;
create policy "match_scorers: creator can add" on public.match_scorers for insert to authenticated
  with check (exists (select 1 from public.matches m where m.id = match_id and m.created_by = (select auth.uid())
    and coalesce(m.fixture_ref, '') not like 'tournament-%'));
drop policy "match_scorers: creator can remove from non-friendly matches" on public.match_scorers;
create policy "match_scorers: creator can remove from non-exclusive matches" on public.match_scorers for delete to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and m.created_by = (select auth.uid())
    and coalesce(m.fixture_ref, '') not like 'friendly-%' and coalesce(m.fixture_ref, '') not like 'tournament-%'));

create or replace function public.offer_scorer_handover(p_match uuid, p_to uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
  v_scorer uuid;
  v_id uuid;
begin
  if v_uid is null or p_match is null then raise exception 'Sign in to hand over scoring' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || p_match::text, 0));
  update public.scorer_handover set status = 'expired', resolved_at = now()
  where match_id = p_match and status = 'pending' and expires_at <= clock_timestamp();
  select * into v_match from public.matches where id = p_match;
  if not found or (coalesce(v_match.fixture_ref, '') not like 'friendly-%' and coalesce(v_match.fixture_ref, '') not like 'tournament-%') then
    raise exception 'You are not allowed to hand over scoring for this match' using errcode = '42501';
  end if;
  select coalesce((select s.user_id from public.match_scorers s where s.match_id = p_match limit 1), v_match.created_by)
  into v_scorer;
  if v_uid is distinct from v_scorer and v_uid is distinct from v_match.created_by then
    raise exception 'You are not allowed to hand over scoring for this match' using errcode = '42501';
  end if;
  if v_match.status = 'completed' then raise exception 'This match is finished' using errcode = 'ESH05'; end if;
  if p_to is null or p_to is not distinct from v_scorer or not exists (select 1 from public.profiles p where p.id = p_to) then
    raise exception 'Choose another signed-in player to score this match' using errcode = '42501';
  end if;
  -- A creator who is not the scorer may only take scoring for themselves, and only from an idle scorer.
  if v_uid is distinct from v_scorer and p_to is distinct from v_uid then
    raise exception 'Only the creator can take over from another scorer' using errcode = '42501';
  end if;
  if v_uid is distinct from v_scorer and exists (
    select 1 from public.ball_events e where e.match_id = p_match and e.created_at > clock_timestamp() - interval '15 minutes'
  ) then
    raise exception 'The scorer was active a moment ago' using errcode = 'ESH04';
  end if;
  update public.scorer_handover set status = 'cancelled', resolved_at = now()
  where match_id = p_match and status = 'pending' and from_user is distinct from v_scorer;
  if exists (select 1 from public.scorer_handover h where h.match_id = p_match and h.status = 'pending') then
    raise exception 'Scoring is already being handed over' using errcode = 'ESH02';
  end if;
  insert into public.scorer_handover (match_id, from_user, to_user, initiated_by, status, created_at, expires_at)
  values (p_match, v_scorer, p_to, v_uid, 'pending', now(), now() + interval '15 minutes')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.accept_scorer_handover(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.scorer_handover;
  v_match public.matches;
  v_scorer uuid;
begin
  if v_uid is null or p_id is null then raise exception 'Sign in to accept scoring' using errcode = '42501'; end if;
  select * into v_offer from public.scorer_handover where id = p_id;
  if not found then raise exception 'You are not allowed to accept this scoring request' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || v_offer.match_id::text, 0));
  update public.scorer_handover set status = 'expired', resolved_at = now()
  where match_id = v_offer.match_id and status = 'pending' and expires_at <= clock_timestamp();
  select * into v_offer from public.scorer_handover where id = p_id;
  if v_offer.to_user is distinct from v_uid then
    raise exception 'You are not allowed to accept this scoring request' using errcode = '42501';
  end if;
  if v_offer.status = 'accepted' then return; end if;
  if v_offer.status <> 'pending' then raise exception 'This scoring request is no longer open' using errcode = 'ESH01'; end if;
  select * into v_match from public.matches where id = v_offer.match_id;
  if not found or (coalesce(v_match.fixture_ref, '') not like 'friendly-%' and coalesce(v_match.fixture_ref, '') not like 'tournament-%') then
    raise exception 'You are not allowed to accept this scoring request' using errcode = '42501';
  end if;
  if v_match.status = 'completed' then raise exception 'This match is finished' using errcode = 'ESH05'; end if;
  select coalesce((select s.user_id from public.match_scorers s where s.match_id = v_offer.match_id limit 1), v_match.created_by)
  into v_scorer;
  if v_scorer is distinct from v_offer.from_user then
    update public.scorer_handover set status = 'cancelled', resolved_at = now() where id = p_id;
    raise exception 'The scorer changed' using errcode = 'ESH03';
  end if;
  if v_offer.initiated_by is distinct from v_offer.from_user and exists (
    select 1 from public.ball_events e where e.match_id = v_offer.match_id and e.created_at > clock_timestamp() - interval '15 minutes'
  ) then
    raise exception 'The scorer was active a moment ago' using errcode = 'ESH04';
  end if;
  delete from public.match_scorers where match_id = v_offer.match_id;
  insert into public.match_scorers (match_id, user_id) values (v_offer.match_id, v_offer.to_user);
  update public.scorer_handover set status = 'accepted', resolved_at = now() where id = p_id;
end;
$$;

create or replace function public.notify_scorer_assigned() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_match public.matches;
  v_by text;
begin
  if (select auth.uid()) is null or new.user_id is not distinct from (select auth.uid()) then
    return new;
  end if;
  select * into v_match from public.matches where id = new.match_id;
  if not found or (coalesce(v_match.fixture_ref, '') not like 'friendly-%' and coalesce(v_match.fixture_ref, '') not like 'tournament-%') then
    return new;
  end if;
  select coalesce(nullif(full_name, ''), 'Someone') into v_by from public.profiles where id = (select auth.uid());
  insert into public.notifications (user_id, kind, title, message, data)
  values (new.user_id, 'system', 'You are the scorer',
    coalesce(v_by, 'Someone') || ' chose you to score ' || v_match.team_a_name || ' vs ' || v_match.team_b_name || '.',
    jsonb_build_object('type', 'scorer_assigned', 'match_id', new.match_id));
  return new;
end;
$$;

-- Live totals are derived from the authoritative, non-void ball log, not sent separately by the client.
-- Statement triggers recalculate once for a multi-row undo. The existing (match_id, seq) index bounds each scan.
create function public.refresh_tournament_match_totals(p_match uuid) returns void
language sql security definer set search_path = '' as $$
  with innings as (
    select distinct on (e.innings) e.innings, p.side
    from public.ball_events e join public.match_players p on p.match_id = e.match_id and p.key = e.striker_key
    where e.match_id = p_match and e.kind = 'innings_start' and e.voided_at is null
    order by e.innings, e.seq
  ), totals as (
    select i.side, coalesce(sum(e.total_runs) filter (where e.kind = 'delivery'), 0)::smallint runs,
      count(*) filter (where e.kind = 'delivery' and e.out_key is not null)::smallint wickets,
      count(*) filter (where e.kind = 'delivery' and e.is_legal)::smallint balls
    from innings i left join public.ball_events e on e.match_id = p_match and e.innings = i.innings and e.voided_at is null
    group by i.side
  )
  update public.matches m set
    team_a_runs = a.runs, team_a_wickets = a.wickets, team_a_balls = a.balls,
    team_b_runs = b.runs, team_b_wickets = b.wickets, team_b_balls = b.balls
  from (select (select runs from totals where side = 'a') runs, (select wickets from totals where side = 'a') wickets,
               (select balls from totals where side = 'a') balls) a,
       (select (select runs from totals where side = 'b') runs, (select wickets from totals where side = 'b') wickets,
               (select balls from totals where side = 'b') balls) b
  where m.id = p_match and m.tournament_id is not null and m.status = 'live'
    and (m.team_a_runs, m.team_a_wickets, m.team_a_balls, m.team_b_runs, m.team_b_wickets, m.team_b_balls)
      is distinct from (a.runs, a.wickets, a.balls, b.runs, b.wickets, b.balls);
$$;
revoke all on function public.refresh_tournament_match_totals(uuid) from public, anon, authenticated;

create function public.refresh_tournament_totals_from_events() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_match uuid;
begin
  for v_match in select distinct match_id from changed_events loop
    perform public.refresh_tournament_match_totals(v_match);
  end loop;
  return null;
end $$;
revoke all on function public.refresh_tournament_totals_from_events() from public, anon, authenticated;
create trigger tournament_totals_insert after insert on public.ball_events
  referencing new table as changed_events for each statement execute function public.refresh_tournament_totals_from_events();
create trigger tournament_totals_update after update on public.ball_events
  referencing new table as changed_events for each statement execute function public.refresh_tournament_totals_from_events();

create function public.refresh_tournament_totals_after_reopen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'completed' and new.status = 'live' and new.tournament_id is not null then
    perform public.refresh_tournament_match_totals(new.id);
  end if;
  return null;
end $$;
revoke all on function public.refresh_tournament_totals_after_reopen() from public, anon, authenticated;
create trigger tournament_totals_reopen after update of status on public.matches
  for each row execute function public.refresh_tournament_totals_after_reopen();
