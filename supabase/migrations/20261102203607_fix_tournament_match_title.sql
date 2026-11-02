-- Fix: the match title of a started tournament fixture used a literal "?" where "·" was meant
-- ("Match 3 ? Semi-final"). Same function as 20261102195136, with only that character changed. Titles already
-- written with "?" are repaired too.

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

update public.matches set title = replace(title, ' ? ', ' · ')
 where fixture_ref like 'tournament-%' and title like '% ? %';
