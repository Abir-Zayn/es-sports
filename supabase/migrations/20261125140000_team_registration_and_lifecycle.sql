-- Teams as a feature of their own: draft teams register at 4 players, invites are capped and re-sent with a gap,
-- removals and deletions are told to the players, and teams nobody used for 90 days are cleared away.
-- Every function below that already existed was read from the live database first; only the noted parts change.

-- 1. A standalone team starts as a draft and registers once it has 4 members. Existing teams count as registered.
alter table public.teams add column if not exists registered_at timestamptz default now();
update public.teams set registered_at = created_at where registered_at is null;

create or replace function public.create_team(p_id uuid, p_name text, p_short_name text, p_tone text default 'neutral'::text,
  p_logo_url text default null::text, p_area text default null::text, p_district text default null::text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare v_existed boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to create a team' using errcode = '42501';
  end if;
  v_existed := exists (select 1 from public.teams where id = p_id);
  perform public.insert_team((select auth.uid()), p_id, p_name, p_short_name, p_tone, p_logo_url, p_area, p_district);
  -- New: a team made here is a draft until register_team. A retry of the same id keeps whatever state it has.
  if not v_existed then update public.teams set registered_at = null where id = p_id; end if;
  return p_id;
end;
$function$;

create or replace function public.register_team(p_team uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare v_role text := public.begin_team_change(p_team); v_count int;
begin
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only the team owner or an admin can register the team' using errcode = '42501';
  end if;
  if exists (select 1 from public.teams where id = p_team and registered_at is not null) then return; end if;
  select count(*) into v_count from public.team_members where team_id = p_team;
  if v_count < 4 then
    raise exception 'A team needs 4 players to register. It has %.', v_count using errcode = 'ET020';
  end if;
  update public.teams set registered_at = now() where id = p_team;
end $function$;

-- 2. Invites: at most 16 members and open invites together; a player can be invited again 30 minutes after the last
--    invite, up to 4 invites in all (the first and 3 more). Re-inviting replaces an open invite.
create or replace function public.send_team_player_invite(p_team uuid, p_to uuid)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_role text;
  v_id uuid;
  v_sent int;
  v_last timestamptz;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_team is null or p_to is null or p_to = v_uid then raise exception 'Invalid target' using errcode = '22023'; end if;
  v_role := public.begin_team_change(p_team);
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only the team owner or an admin can add members' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_to)
     or exists (select 1 from public.team_members where team_id = p_team and profile_id = p_to) then
    raise exception 'That person cannot be invited to this team' using errcode = '22023';
  end if;
  if public.tournament_team_clash(p_team, p_to, 'player') is not null then
    raise exception 'This player already plays for another team in this tournament' using errcode = 'ET002';
  end if;
  update public.invitations set status = 'expired', resolved_at = now()
   where kind = 'team_player' and team_id = p_team and status = 'pending' and expires_at <= now();
  -- New: the cap counts members and other people's open invites.
  if (select count(*) from public.team_members where team_id = p_team)
     + (select count(*) from public.invitations where kind = 'team_player' and team_id = p_team and status = 'pending' and to_user <> p_to) >= 16 then
    raise exception 'A team has at most 16 players, counting open invites' using errcode = 'ET021';
  end if;
  -- New: re-invites, instead of refusing while one is open.
  select count(*), max(created_at) into v_sent, v_last
    from public.invitations where kind = 'team_player' and team_id = p_team and to_user = p_to;
  if v_sent > 0 then
    if v_last > now() - interval '30 minutes' then
      raise exception 'You can invite this player again 30 minutes after the last invite' using errcode = 'EI005';
    end if;
    if v_sent >= 4 then
      raise exception 'This player has already been invited 4 times' using errcode = 'EI006';
    end if;
    update public.invitations set status = 'cancelled', resolved_at = now()
     where kind = 'team_player' and team_id = p_team and to_user = p_to and status = 'pending';
  end if;
  insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at)
  values ('team_player', null, p_team, v_uid, p_to, 'pending', now() + interval '7 days') returning id into v_id;
  insert into public.notifications (user_id, kind, title, message, data)
  values (p_to, 'invite', 'Team invitation', 'You were invited to play for a team.',
    jsonb_build_object('invitation_id', v_id, 'invite_kind', 'team_player', 'team_id', p_team, 'status', 'pending'));
  return v_id;
end $function$;

-- 3. Accepting: a standalone team's invite is valid while its sender still runs the team (before, only a tournament
--    staff sender was accepted, so no standalone invite could ever be taken up). A full team refuses.
create or replace function public.accept_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_inv public.invitations;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into v_inv from public.invitations where id = p_id for update;
  if not found or v_inv.to_user is distinct from v_uid then raise exception 'Not allowed' using errcode = '42501'; end if;
  if v_inv.status = 'accepted' then return; end if;
  if v_inv.status <> 'pending' or v_inv.expires_at <= now() then raise exception 'Invitation not open' using errcode = 'EI001'; end if;
  if v_inv.kind = 'tournament_moderator' then
    perform 1 from public.tournaments where id = v_inv.tournament_id for update;
    insert into public.tournament_staff (tournament_id, user_id, role)
    values (v_inv.tournament_id, v_uid, 'moderator') on conflict (tournament_id, user_id) do nothing;
  elsif v_inv.kind = 'team_player' then
    perform 1 from public.teams where id = v_inv.team_id for update;
    if not (public.team_member_role(v_inv.team_id, v_inv.from_user) in ('owner', 'admin')
            or exists (select 1 from public.tournament_teams tt join public.tournament_staff s on s.tournament_id = tt.tournament_id
                        where tt.team_id = v_inv.team_id and s.user_id = v_inv.from_user)) then
      raise exception 'The sender can no longer add members to this team' using errcode = 'EI003';
    end if;
    if (select count(*) from public.team_members where team_id = v_inv.team_id) >= 16 then
      raise exception 'This team already has 16 players' using errcode = 'ET021';
    end if;
    insert into public.team_members (team_id, profile_id, role)
    values (v_inv.team_id, v_uid, 'player') on conflict (team_id, profile_id) do nothing;
  else
    raise exception 'This kind of invitation is no longer used' using errcode = 'EI003';
  end if;
  update public.invitations set status = 'accepted', resolved_at = now() where id = p_id;
  update public.notifications set read_at = coalesce(read_at, now()), data = jsonb_set(data, '{status}', '"accepted"'::jsonb)
   where user_id = v_uid and kind = 'invite' and data ->> 'invitation_id' = p_id::text;
  insert into public.notifications (user_id, kind, title, message, data)
  values (v_inv.from_user, 'invite_response', 'Invitation accepted', 'Your invitation was accepted.',
    jsonb_build_object('invitation_id', p_id, 'tournament_id', v_inv.tournament_id, 'team_id', v_inv.team_id, 'status', 'accepted'));
end $function$;

-- 4. A removed player is told.
create or replace function public.remove_team_member(p_team uuid, p_profile uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_caller text := public.begin_team_change(p_team);
  v_target text := public.team_member_role(p_team, p_profile);
begin
  -- A non-member has a NULL role; without this check the permission test below evaluates to NULL and passes.
  if v_caller is null then
    raise exception 'You are not a member of this team' using errcode = '42501';
  end if;
  if v_target = 'owner' then
    raise exception 'The owner cannot leave or be removed; transfer ownership first' using errcode = '22023';
  end if;
  if p_profile is distinct from (select auth.uid())
    and not (v_caller = 'owner' or (v_caller = 'admin' and v_target in ('player', 'staff'))) then
    raise exception 'You are not allowed to remove this member' using errcode = '42501';
  end if;
  delete from public.team_members where team_id = p_team and profile_id = p_profile;
  if p_profile is distinct from (select auth.uid()) then
    insert into public.notifications (user_id, kind, title, message, data)
    select p_profile, 'system', 'Removed from a team', format('You were removed from %s.', t.name), jsonb_build_object('team_id', p_team)
      from public.teams t where t.id = p_team;
  end if;
end;
$function$;

-- 5. The owner deletes a team. A team in a tournament stays: deleting it would take it out of that tournament.
create or replace function public.delete_team(p_team uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare v_uid uuid := (select auth.uid());
begin
  perform public.begin_team_change(p_team);
  if public.team_member_role(p_team, v_uid) is distinct from 'owner' then
    raise exception 'Only the team owner can delete the team' using errcode = '42501';
  end if;
  if exists (select 1 from public.tournament_teams where team_id = p_team) then
    raise exception 'This team is entered in a tournament. Take it out of the tournament first.' using errcode = 'ET022';
  end if;
  insert into public.notifications (user_id, kind, title, message, data)
  select m.profile_id, 'system', 'Team deleted', format('%s was deleted by its owner.', t.name), jsonb_build_object('team_id', p_team)
    from public.team_members m join public.teams t on t.id = m.team_id
   where m.team_id = p_team and m.profile_id <> v_uid;
  delete from public.teams where id = p_team;
end $function$;

-- 6. Teams that never played a tournament match and saw no change, member or invite for 90 days are deleted daily.
create or replace function public.purge_inactive_teams()
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare v_count int;
begin
  with stale as (
    select t.id, t.name from public.teams t
    where not exists (select 1 from public.tournament_teams tt where tt.team_id = t.id)
      and not exists (select 1 from public.tournament_fixtures f where t.id in (f.home_team_id, f.away_team_id))
      and greatest(t.created_at, coalesce(t.updated_at, t.created_at),
            coalesce((select max(m.joined_at) from public.team_members m where m.team_id = t.id), t.created_at),
            coalesce((select max(i.created_at) from public.invitations i where i.team_id = t.id), t.created_at))
          < now() - interval '90 days'
  ), told as (
    insert into public.notifications (user_id, kind, title, message, data)
    select m.profile_id, 'system', 'Team removed', format('%s was removed after 90 days without matches or activity.', s.name),
           jsonb_build_object('team_id', s.id)
      from stale s join public.team_members m on m.team_id = s.id
    returning 1
  ), gone as (
    delete from public.teams where id in (select id from stale) returning 1
  )
  select count(*) into v_count from gone;
  return v_count;
end $function$;

revoke all on function public.register_team(uuid), public.delete_team(uuid) from public, anon;
grant execute on function public.register_team(uuid), public.delete_team(uuid) to authenticated;
revoke all on function public.purge_inactive_teams() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'purge-inactive-teams';
select cron.schedule('purge-inactive-teams', '41 3 * * *', 'select public.purge_inactive_teams()');
