-- Team player invitations: a team's owner or admin adds members (Team management screen).
--
-- * New invitation kind `team_player`. It belongs to a team, not a tournament, so `tournament_id` becomes nullable:
--   it is null exactly for `team_player`, and `team_id` is set for `team_owner` and `team_player`.
-- * `send_team_player_invite(team, to)`: caller must be the team's owner or an admin. The recipient must have a
--   profile, must not be the caller and must not already be a member. One open invitation per team and person
--   (EI002). If the team is entered in a tournament where the recipient already plays for another team, ET002 is
--   raised now instead of at acceptance.
-- * `accept_invitation` gains the `team_player` branch: the sender must still be the team's owner or an admin
--   (else EI003), then the recipient joins as `player`. The one-playing-team-per-tournament trigger
--   (20261102050000) still guards that insert.
-- * Decline and cancel already work for any kind. Notifications carry `invite_kind` so the app can label them.

alter table public.invitations alter column tournament_id drop not null;
alter table public.invitations drop constraint invitations_kind_check;
alter table public.invitations add constraint invitations_kind_check
  check (kind in ('tournament_moderator', 'team_owner', 'team_player'));
alter table public.invitations drop constraint invitations_check2;
alter table public.invitations add constraint invitations_team_check
  check ((kind in ('team_owner', 'team_player')) = (team_id is not null));
alter table public.invitations add constraint invitations_tournament_check
  check ((kind = 'team_player') = (tournament_id is null));

create unique index invitations_one_pending_player_idx
  on public.invitations (team_id, to_user) where kind = 'team_player' and status = 'pending';
create index invitations_team_idx on public.invitations (team_id) where team_id is not null;

create function public.send_team_player_invite(p_team uuid, p_to uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text;
  v_id uuid;
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
  if exists (select 1 from public.invitations where kind = 'team_player' and team_id = p_team and to_user = p_to and status = 'pending') then
    raise exception 'A team invitation is already pending' using errcode = 'EI002';
  end if;
  insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at)
  values ('team_player', null, p_team, v_uid, p_to, 'pending', now() + interval '7 days') returning id into v_id;
  insert into public.notifications (user_id, kind, title, message, data)
  values (p_to, 'invite', 'Team invitation', 'You were invited to play for a team.',
    jsonb_build_object('invitation_id', v_id, 'invite_kind', 'team_player', 'team_id', p_team, 'status', 'pending'));
  return v_id;
end $$;

-- Same as 20261102020000, plus the `team_player` branch.
create or replace function public.accept_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
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
    if not exists (select 1 from public.team_members where team_id = v_inv.team_id and profile_id = v_inv.from_user and role in ('owner', 'admin')) then
      raise exception 'The sender can no longer add members to this team' using errcode = 'EI003';
    end if;
    insert into public.team_members (team_id, profile_id, role)
    values (v_inv.team_id, v_uid, 'player') on conflict (team_id, profile_id) do nothing;
  else
    perform 1 from public.teams where id = v_inv.team_id for update;
    if not exists (select 1 from public.team_members where team_id = v_inv.team_id and profile_id = v_inv.from_user and role = 'owner') then
      raise exception 'The sender no longer owns this team' using errcode = 'EI003';
    end if;
    insert into public.team_members (team_id, profile_id, role)
    values (v_inv.team_id, v_uid, 'admin') on conflict (team_id, profile_id) do nothing;
    update public.team_members set role = 'admin' where team_id = v_inv.team_id and profile_id = v_inv.from_user;
    update public.team_members set role = 'owner' where team_id = v_inv.team_id and profile_id = v_uid;
  end if;
  update public.invitations set status = 'accepted', resolved_at = now() where id = p_id;
  update public.notifications set read_at = coalesce(read_at, now()), data = jsonb_set(data, '{status}', '"accepted"'::jsonb)
   where user_id = v_uid and kind = 'invite' and data ->> 'invitation_id' = p_id::text;
  insert into public.notifications (user_id, kind, title, message, data)
  values (v_inv.from_user, 'invite_response', 'Invitation accepted', 'Your invitation was accepted.',
    jsonb_build_object('invitation_id', p_id, 'tournament_id', v_inv.tournament_id, 'team_id', v_inv.team_id, 'status', 'accepted'));
end $$;

revoke all on function public.send_team_player_invite(uuid, uuid) from public, anon;
grant execute on function public.send_team_player_invite(uuid, uuid) to authenticated;
