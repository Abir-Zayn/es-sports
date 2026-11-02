-- A team created for a tournament stays ownerless until its first owner accepts.
create or replace function public.create_tournament_team(
  p_tournament uuid, p_team uuid, p_name text, p_short_name text, p_tone text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_creator uuid; v_new boolean;
begin
  if public.begin_tournament_change(p_tournament) is null then
    raise exception 'Only tournament staff can add teams' using errcode = '42501';
  end if;
  if p_team is null then raise exception 'Team id is required' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('create_team:' || p_team::text, 0));
  select created_by into v_creator from public.teams where id = p_team;
  v_new := not found;
  if not v_new then
    if v_creator is distinct from v_uid or not exists (
      select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team
    ) then raise exception 'This team id is already used' using errcode = '23505'; end if;
    return;
  end if;
  perform public.insert_team(v_uid, p_team, p_name, p_short_name, p_tone);
  delete from public.team_members where team_id = p_team and profile_id = v_uid and role = 'owner';
  perform public.link_tournament_team(p_tournament, p_team, 'owner');
end $$;

-- Staff may see the owner requests for their tournament, including requests sent by another staff member.
create policy invitations_select_tournament_staff_owner_requests on public.invitations
for select to authenticated using (
  kind = 'team_owner' and exists (
    select 1 from public.tournament_staff s
    where s.tournament_id = invitations.tournament_id and s.user_id = (select auth.uid())
      and s.role in ('owner', 'moderator')
  )
);

create or replace function public.send_team_owner_invite(p_tournament uuid, p_team uuid, p_to uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_tournament is null or p_team is null or p_to is null or p_to = v_uid then raise exception 'Invalid target' using errcode = '22023'; end if;
  perform 1 from public.tournaments where id = p_tournament for update;
  if not found or not exists (select 1 from public.tournament_staff where tournament_id = p_tournament and user_id = v_uid and role in ('owner', 'moderator')) then
    raise exception 'Only tournament staff can send team owner invitations' using errcode = '42501';
  end if;
  perform 1 from public.teams where id = p_team for update;
  if not found or not exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team)
     or not exists (select 1 from public.profiles where id = p_to) then
    raise exception 'Invalid team or recipient for tournament' using errcode = '22023';
  end if;
  if exists (select 1 from public.team_members where team_id = p_team and role = 'owner') then
    raise exception 'This team already has an owner' using errcode = 'EI003';
  end if;
  update public.invitations set status = 'expired', resolved_at = now()
   where kind = 'team_owner' and team_id = p_team and status = 'pending' and expires_at <= now();
  if exists (select 1 from public.invitations where kind = 'team_owner' and team_id = p_team and status = 'pending') then
    raise exception 'A team owner invitation is already pending' using errcode = 'EI002';
  end if;
  insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at)
  values ('team_owner', p_tournament, p_team, v_uid, p_to, 'pending', now() + interval '7 days') returning id into v_id;
  insert into public.notifications (user_id, kind, title, message, data)
  values (p_to, 'invite', 'Team ownership invitation', 'You were invited to take ownership of a team.',
    jsonb_build_object('invitation_id', v_id, 'tournament_id', p_tournament, 'team_id', p_team, 'status', 'pending'));
  return v_id;
end $$;

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
    if not exists (select 1 from public.tournament_staff where tournament_id = v_inv.tournament_id and user_id = v_inv.from_user and role in ('owner', 'moderator'))
       or not exists (select 1 from public.tournament_teams where tournament_id = v_inv.tournament_id and team_id = v_inv.team_id)
       or exists (select 1 from public.team_members where team_id = v_inv.team_id and role = 'owner') then
      raise exception 'This team can no longer accept a first owner' using errcode = 'EI003';
    end if;
    insert into public.team_members (team_id, profile_id, role) values (v_inv.team_id, v_uid, 'owner')
    on conflict (team_id, profile_id) do update set role = 'owner';
  end if;
  update public.invitations set status = 'accepted', resolved_at = now() where id = p_id;
  update public.notifications set read_at = coalesce(read_at, now()), data = jsonb_set(data, '{status}', '"accepted"'::jsonb)
   where user_id = v_uid and kind = 'invite' and data ->> 'invitation_id' = p_id::text;
  insert into public.notifications (user_id, kind, title, message, data)
  values (v_inv.from_user, 'invite_response', 'Invitation accepted', 'Your invitation was accepted.',
    jsonb_build_object('invitation_id', p_id, 'tournament_id', v_inv.tournament_id, 'team_id', v_inv.team_id, 'status', 'accepted'));
end $$;

create or replace function public.cancel_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_inv public.invitations;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into v_inv from public.invitations where id = p_id for update;
  if not found or (v_inv.from_user is distinct from v_uid and not (v_inv.kind = 'team_owner' and exists (select 1 from public.tournament_staff where tournament_id = v_inv.tournament_id and user_id = v_uid and role in ('owner', 'moderator')))) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if v_inv.status = 'cancelled' then return; end if;
  if v_inv.status <> 'pending' or v_inv.expires_at <= now() then raise exception 'Invitation not open' using errcode = 'EI001'; end if;
  update public.invitations set status = 'cancelled', resolved_at = now() where id = p_id;
end $$;
