-- Step 11 (Job 2): Tournament invitations and in-app notifications.
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('tournament_moderator', 'team_owner')),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (from_user <> to_user),
  check ((status = 'pending') = (resolved_at is null)),
  check ((kind = 'team_owner') = (team_id is not null))
);

create unique index if not exists invitations_one_pending_idx
  on public.invitations (kind, tournament_id, coalesce(team_id, '00000000-0000-0000-0000-000000000000'::uuid), to_user) where status = 'pending';
create index if not exists invitations_to_user_idx on public.invitations (to_user, created_at desc);
create index if not exists invitations_from_user_idx on public.invitations (from_user, created_at desc);

alter table public.invitations enable row level security;
revoke all on public.invitations from public, anon;
revoke insert, update, delete, truncate on public.invitations from authenticated;
grant select on public.invitations to authenticated;
drop policy if exists invitations_select_participants on public.invitations;
create policy invitations_select_participants on public.invitations for select to authenticated using ((select auth.uid()) in (from_user, to_user));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('invite', 'invite_response', 'system')),
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon;
revoke insert, update, delete, truncate on public.notifications from authenticated;
grant select on public.notifications to authenticated;
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.send_tournament_moderator_invite(p_tournament uuid, p_to uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_tournament is null or p_to is null or p_to = v_uid then raise exception 'Invalid target' using errcode = '22023'; end if;
  perform 1 from public.tournaments where id = p_tournament for update;
  if not found or not exists (select 1 from public.tournament_staff where tournament_id = p_tournament and user_id = v_uid and role = 'owner') then
    raise exception 'Only the tournament owner can invite moderators' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_to)
     or exists (select 1 from public.tournament_staff where tournament_id = p_tournament and user_id = p_to) then
    raise exception 'Recipient cannot be invited as moderator' using errcode = '22023';
  end if;
  update public.invitations set status = 'expired', resolved_at = now()
   where tournament_id = p_tournament and status = 'pending' and expires_at <= now();
  if exists (select 1 from public.invitations where kind = 'tournament_moderator' and tournament_id = p_tournament and to_user = p_to and status = 'pending') then
    raise exception 'A moderator invitation is already pending' using errcode = 'EI002';
  end if;
  insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at)
  values ('tournament_moderator', p_tournament, null, v_uid, p_to, 'pending', now() + interval '7 days') returning id into v_id;
  insert into public.notifications (user_id, kind, title, message, data)
  values (p_to, 'invite', 'Tournament moderator invitation', 'You were invited to moderate a tournament.',
    jsonb_build_object('invitation_id', v_id, 'tournament_id', p_tournament, 'team_id', null, 'status', 'pending'));
  return v_id;
end $$;

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
  if not exists (select 1 from public.team_members where team_id = p_team and profile_id = v_uid and role = 'owner') then
    raise exception 'You do not own this team' using errcode = 'EI003';
  end if;
  update public.invitations set status = 'expired', resolved_at = now()
   where tournament_id = p_tournament and status = 'pending' and expires_at <= now();
  update public.invitations set status = 'cancelled', resolved_at = now()
   where kind = 'team_owner' and tournament_id = p_tournament and team_id = p_team and status = 'pending' and from_user <> v_uid;
  if exists (select 1 from public.invitations where kind = 'team_owner' and tournament_id = p_tournament and team_id = p_team and to_user = p_to and status = 'pending') then
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

create or replace function public.decline_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_inv public.invitations;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into v_inv from public.invitations where id = p_id for update;
  if not found or v_inv.to_user is distinct from v_uid then raise exception 'Not allowed' using errcode = '42501'; end if;
  if v_inv.status = 'declined' then return; end if;
  if v_inv.status <> 'pending' or v_inv.expires_at <= now() then raise exception 'Invitation not open' using errcode = 'EI001'; end if;
  update public.invitations set status = 'declined', resolved_at = now() where id = p_id;
  update public.notifications set read_at = coalesce(read_at, now()), data = jsonb_set(data, '{status}', '"declined"'::jsonb)
   where user_id = v_uid and kind = 'invite' and data ->> 'invitation_id' = p_id::text;
  insert into public.notifications (user_id, kind, title, message, data)
  values (v_inv.from_user, 'invite_response', 'Invitation declined', 'Your invitation was declined.',
    jsonb_build_object('invitation_id', p_id, 'tournament_id', v_inv.tournament_id, 'team_id', v_inv.team_id, 'status', 'declined'));
end $$;

create or replace function public.cancel_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_inv public.invitations;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into v_inv from public.invitations where id = p_id for update;
  if not found or v_inv.from_user is distinct from v_uid then raise exception 'Not allowed' using errcode = '42501'; end if;
  if v_inv.status = 'cancelled' then return; end if;
  if v_inv.status <> 'pending' or v_inv.expires_at <= now() then raise exception 'Invitation not open' using errcode = 'EI001'; end if;
  update public.invitations set status = 'cancelled', resolved_at = now() where id = p_id;
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  update public.notifications set read_at = now() where user_id = v_uid and read_at is null and (p_ids is null or id = any(p_ids));
end $$;

revoke all on function public.send_tournament_moderator_invite(uuid, uuid), public.send_team_owner_invite(uuid, uuid, uuid),
  public.accept_invitation(uuid), public.decline_invitation(uuid), public.cancel_invitation(uuid), public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.send_tournament_moderator_invite(uuid, uuid), public.send_team_owner_invite(uuid, uuid, uuid),
  public.accept_invitation(uuid), public.decline_invitation(uuid), public.cancel_invitation(uuid), public.mark_notifications_read(uuid[]) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
