-- Removing people and teams from a tournament (workfile items 2 and 3).
--
-- * `remove_tournament_moderator`: the tournament owner removes a moderator, or a moderator steps down. The same
--   call withdraws a moderator invitation that is still pending, so the app has one action for "Remove" and
--   "Cancel". Team owner requests the removed moderator sent are cancelled too: `accept_invitation` would refuse
--   them anyway (EI003), and cancelling lets the remaining staff send fresh ones. The removed person is notified.
-- * `remove_tournament_team`: only the tournament owner. Pending owner requests for the team are cancelled and the
--   team leaves the tournament. A team created inside the tournament that never got an owner (no members, entered
--   nowhere else) is deleted with it; a real team keeps existing and its owner is notified.
-- * Both are idempotent: a repeat after success returns without error.
-- * Locks follow the order used elsewhere: tournament row (`begin_tournament_change`), then the team row.
-- * Error codes: 42501 not signed in or not allowed, 22023 invalid input, P0002 tournament not found.

create or replace function public.remove_tournament_moderator(p_tournament uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text := public.begin_tournament_change(p_tournament);
  v_removed int;
begin
  if p_user is null then raise exception 'Choose who to remove' using errcode = '22023'; end if;
  if v_role is distinct from 'owner' and not (v_role = 'moderator' and p_user = v_uid) then
    raise exception 'Only the tournament owner can remove moderators' using errcode = '42501';
  end if;
  if exists (select 1 from public.tournament_staff where tournament_id = p_tournament and user_id = p_user and role = 'owner') then
    raise exception 'The tournament owner cannot be removed' using errcode = '22023';
  end if;
  delete from public.tournament_staff where tournament_id = p_tournament and user_id = p_user and role = 'moderator';
  get diagnostics v_removed = row_count;
  update public.invitations set status = 'cancelled', resolved_at = now()
   where tournament_id = p_tournament and status = 'pending'
     and ((kind = 'tournament_moderator' and to_user = p_user) or (kind = 'team_owner' and from_user = p_user));
  if v_removed > 0 and p_user <> v_uid then
    insert into public.notifications (user_id, kind, title, message, data)
    values (p_user, 'system', 'Removed from tournament staff', 'You are no longer a moderator of this tournament.',
      jsonb_build_object('tournament_id', p_tournament, 'event', 'moderator_removed'));
  end if;
end $$;

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

revoke all on function public.remove_tournament_moderator(uuid, uuid), public.remove_tournament_team(uuid, uuid)
  from public, anon;
grant execute on function public.remove_tournament_moderator(uuid, uuid), public.remove_tournament_team(uuid, uuid)
  to authenticated;
