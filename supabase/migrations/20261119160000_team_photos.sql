-- Team profile & cover photos managed from tournament Teams & staff, plus app-wide image exposure.
--
-- * `teams.cover_url`: nullable https URL for a team's cover photo (alongside existing `teams.logo_url`).
-- * Storage RLS on `storage.objects` (bucket `avatars`, prefix `teams/<team_id>/...`): team owners/admins and
--   active tournament owners/moderators can upload, list, replace, and delete team media, so whoever replaces
--   or removes a photo can delete the old file regardless of who originally uploaded it.
-- * `update_tournament_team_images`: atomically updates `teams.logo_url` and `teams.cover_url` inside a locked
--   tournament + team transaction, syncs `matches.team_a_image_url` / `team_b_image_url` for linked fixtures
--   when `logo_url` changes, and returns `(previous_logo_url, previous_cover_url)` so the client can immediately
--   purge replaced or removed files from Storage.
-- * `tournament_standings`: exposes `tm.logo_url` at the end of the select list so points tables show team logos.

alter table public.teams
  add column cover_url text check (cover_url ~ '^https://');

grant update (cover_url) on public.teams to authenticated;

create or replace function public.can_manage_team_media(p_team_text text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_team uuid;
begin
  if v_uid is null or p_team_text is null
    or p_team_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  v_team := p_team_text::uuid;
  return exists (
    select 1
    from public.team_members tm
    where tm.team_id = v_team
      and tm.profile_id = v_uid
      and tm.role in ('owner', 'admin')
  ) or exists (
    select 1
    from public.tournament_teams tt
    join public.tournament_staff ts on ts.tournament_id = tt.tournament_id
    join public.tournaments t on t.id = tt.tournament_id
    where tt.team_id = v_team
      and ts.user_id = v_uid
      and ts.role in ('owner', 'moderator')
      and t.deleted_at is null
      and t.closed_at is null
  );
end;
$$;

revoke all on function public.can_manage_team_media(text) from public, anon;
grant execute on function public.can_manage_team_media(text) to authenticated;

create policy "avatars: team managers can list"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'teams'
    and public.can_manage_team_media((storage.foldername(name))[2])
  );

create policy "avatars: team managers can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'teams'
    and public.can_manage_team_media((storage.foldername(name))[2])
  );

create policy "avatars: team managers can replace"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'teams'
    and public.can_manage_team_media((storage.foldername(name))[2])
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'teams'
    and public.can_manage_team_media((storage.foldername(name))[2])
  );

create policy "avatars: team managers can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'teams'
    and public.can_manage_team_media((storage.foldername(name))[2])
  );

create function public.update_tournament_team_images(
  p_tournament uuid,
  p_team uuid,
  p_logo_url text,
  p_cover_url text
) returns table (previous_logo_url text, previous_cover_url text)
language plpgsql security definer set search_path = '' as $$
declare
  v_tournament_role text;
  v_team_role text;
  v_logo text := nullif(btrim(p_logo_url), '');
  v_cover text := nullif(btrim(p_cover_url), '');
  v_old_logo text;
  v_old_cover text;
begin
  v_tournament_role := public.begin_tournament_change(p_tournament);
  v_team_role := public.begin_team_change(p_team);

  if (v_tournament_role is null or v_tournament_role not in ('owner', 'moderator'))
     and (v_team_role is null or v_team_role not in ('owner', 'admin')) then
    raise exception 'You are not allowed to update this team''s photos' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.tournament_teams
    where tournament_id = p_tournament and team_id = p_team
  ) then
    raise exception 'This team is not in the tournament' using errcode = 'P0002';
  end if;

  if (v_logo is not null and v_logo !~ '^https://')
     or (v_cover is not null and v_cover !~ '^https://') then
    raise exception 'Images must be https links' using errcode = '22023';
  end if;

  select logo_url, cover_url into v_old_logo, v_old_cover
  from public.teams
  where id = p_team;

  update public.teams
     set logo_url = v_logo,
         cover_url = v_cover
   where id = p_team;

  if v_old_logo is distinct from v_logo then
    update public.matches m
       set team_a_image_url = case when f.home_team_id = p_team then v_logo else m.team_a_image_url end,
           team_b_image_url = case when f.away_team_id = p_team then v_logo else m.team_b_image_url end
      from public.tournament_fixtures f
     where f.match_id = m.id
       and (f.home_team_id = p_team or f.away_team_id = p_team);
  end if;

  return query select v_old_logo, v_old_cover;
end;
$$;

revoke all on function public.update_tournament_team_images(uuid, uuid, text, text) from public, anon;
grant execute on function public.update_tournament_team_images(uuid, uuid, text, text) to authenticated;

create or replace view public.tournament_standings with (security_invoker = true) as
with results as (
  select f.tournament_id, f.home_team_id as team_id,
    m.team_a_runs as runs_for,
    case when coalesce(m.team_a_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_a_balls end as balls_for,
    m.team_b_runs as runs_against,
    case when coalesce(m.team_b_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_b_balls end as balls_against,
    case when m.result_type = 'tie' then 'tied' when m.winner_side = 'a' then 'won' else 'lost' end as outcome
  from public.tournament_fixtures f
  join public.matches m on m.id = f.match_id
  join public.tournaments t on t.id = f.tournament_id
  where f.stage = 'League' and f.status = 'scheduled' and m.status = 'completed' and f.home_team_id is not null
  union all
  select f.tournament_id, f.away_team_id,
    m.team_b_runs,
    case when coalesce(m.team_b_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_b_balls end,
    m.team_a_runs,
    case when coalesce(m.team_a_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_a_balls end,
    case when m.result_type = 'tie' then 'tied' when m.winner_side = 'b' then 'won' else 'lost' end
  from public.tournament_fixtures f
  join public.matches m on m.id = f.match_id
  join public.tournaments t on t.id = f.tournament_id
  where f.stage = 'League' and f.status = 'scheduled' and m.status = 'completed' and f.away_team_id is not null
), totals as (
  select tt.tournament_id, tt.team_id,
    count(r.outcome)::int as played,
    count(*) filter (where r.outcome = 'won')::int as won,
    count(*) filter (where r.outcome = 'lost')::int as lost,
    count(*) filter (where r.outcome = 'tied')::int as tied,
    coalesce(sum(r.runs_for), 0)::int as runs_for,
    coalesce(sum(r.balls_for), 0)::int as balls_for,
    coalesce(sum(r.runs_against), 0)::int as runs_against,
    coalesce(sum(r.balls_against), 0)::int as balls_against
  from public.tournament_teams tt
  left join results r on r.tournament_id = tt.tournament_id and r.team_id = tt.team_id
  group by tt.tournament_id, tt.team_id
)
select s.tournament_id, s.team_id, tm.name, tm.short_name, tm.tone,
  s.played, s.won, s.lost, s.tied, (s.won * 2 + s.tied) as points,
  s.runs_for, s.balls_for, s.runs_against, s.balls_against,
  case when s.balls_for > 0 and s.balls_against > 0
    then round(s.runs_for * 6.0 / s.balls_for - s.runs_against * 6.0 / s.balls_against, 3) end as nrr,
  tm.logo_url
from totals s
join public.teams tm on tm.id = s.team_id;

revoke all on public.tournament_standings from public, anon;
grant select on public.tournament_standings to authenticated;
