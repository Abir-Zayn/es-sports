-- Teams and team members (roadmap step 11).
--
-- * `teams` holds a club's identity: name, short name, colour, logo and home area. Any signed-in user can read
--   every team, as the team screens and search need.
-- * `team_members` links accounts to a team. Roles: exactly one `owner`, any number of `admin`, `player` and
--   `staff`. At most one member is captain. A guest player without an account is not a member; guests stay in
--   each match's `match_players`.
-- * Rows are written only by the functions below (security definer, explicit role checks, search_path pinned).
--   Direct writes are revoked, except a team update by its owner or an admin (listed columns only) and a team
--   delete by its owner, both under row level security.
-- * People join only through invitations (step 13). Until then a team has just its owner.
-- * Every member change locks the team row first, so two changes to one team (for example two ownership
--   transfers) run one after the other.
-- * Error codes: 42501 not signed in or not allowed, 22023 invalid input, P0002 team or member not found,
--   23505 team id already used by another account.

create table public.teams (
  id uuid primary key,
  name text not null check (name = btrim(name) and char_length(name) between 2 and 40),
  short_name text not null check (short_name ~ '^[A-Z0-9]{2,4}$'),
  tone text not null default 'neutral' check (tone in ('blue', 'yellow', 'neutral')),
  logo_url text check (logo_url ~ '^https://'),
  area text check (char_length(area) <= 60),
  district text check (char_length(district) <= 60),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'player', 'staff')),
  is_captain boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (team_id, profile_id),
  check (not (is_captain and role = 'staff'))
);

create unique index team_members_one_owner on public.team_members (team_id) where role = 'owner';
create unique index team_members_one_captain on public.team_members (team_id) where is_captain;
create index team_members_profile_idx on public.team_members (profile_id);
create index teams_created_by_idx on public.teams (created_by);

create trigger teams_set_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

-- The caller's role in the team, or null for a non-member.
create function public.team_role(p_team uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.role from public.team_members m where m.team_id = p_team and m.profile_id = (select auth.uid());
$$;

-- Sign-in check and the per-team lock shared by every member change. Returns the caller's role.
create function public.begin_team_change(p_team uuid) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to change this team' using errcode = '42501';
  end if;
  perform 1 from public.teams where id = p_team for update;
  if not found then
    raise exception 'This team could not be found' using errcode = 'P0002';
  end if;
  return public.team_role(p_team);
end;
$$;
revoke all on function public.begin_team_change(uuid) from public, anon, authenticated;

-- A member's role, or P0002 when the profile is not in the team.
create function public.team_member_role(p_team uuid, p_profile uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_role text;
begin
  select role into v_role from public.team_members where team_id = p_team and profile_id = p_profile;
  if v_role is null then
    raise exception 'That person is not a member of this team' using errcode = 'P0002';
  end if;
  return v_role;
end;
$$;
revoke all on function public.team_member_role(uuid, uuid) from public, anon, authenticated;

-- Creates a team with the caller as owner. Idempotent on the id: a repeat by the creator returns it unchanged.
create function public.create_team(
  p_id uuid, p_name text, p_short_name text, p_tone text default 'neutral',
  p_logo_url text default null, p_area text default null, p_district text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_creator uuid;
begin
  if v_uid is null then
    raise exception 'Sign in to create a team' using errcode = '42501';
  end if;
  if p_id is null then
    raise exception 'Team id is required' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('create_team:' || p_id::text, 0));
  select created_by into v_creator from public.teams where id = p_id;
  if found then
    if v_creator is distinct from v_uid then
      raise exception 'This team id is already used' using errcode = '23505';
    end if;
    return p_id;
  end if;
  insert into public.teams (id, name, short_name, tone, logo_url, area, district, created_by)
  values (p_id, btrim(p_name), upper(btrim(p_short_name)), coalesce(p_tone, 'neutral'), nullif(btrim(p_logo_url), ''),
    nullif(btrim(p_area), ''), nullif(btrim(p_district), ''), v_uid);
  insert into public.team_members (team_id, profile_id, role) values (p_id, v_uid, 'owner');
  return p_id;
exception when check_violation or not_null_violation then
  raise exception 'Team details are not valid: %', sqlerrm using errcode = '22023';
end;
$$;

-- The owner makes another member an admin, a player or staff.
create function public.set_team_member_role(p_team uuid, p_profile uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.begin_team_change(p_team) is distinct from 'owner' then
    raise exception 'Only the team owner can change roles' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('admin', 'player', 'staff') then
    raise exception 'Role must be admin, player or staff' using errcode = '22023';
  end if;
  if public.team_member_role(p_team, p_profile) = 'owner' then
    raise exception 'Transfer ownership to change the owner''s role' using errcode = '22023';
  end if;
  update public.team_members set role = p_role, is_captain = is_captain and p_role <> 'staff'
  where team_id = p_team and profile_id = p_profile;
end;
$$;

-- The owner or an admin names the captain, or clears it with null. Staff cannot be captain.
create function public.set_team_captain(p_team uuid, p_profile uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_caller text := public.begin_team_change(p_team);
begin
  if v_caller is null or v_caller not in ('owner', 'admin') then
    raise exception 'Only the owner or an admin can choose the captain' using errcode = '42501';
  end if;
  if p_profile is not null and public.team_member_role(p_team, p_profile) = 'staff' then
    raise exception 'Staff cannot be captain' using errcode = '22023';
  end if;
  update public.team_members set is_captain = false where team_id = p_team and is_captain;
  if p_profile is not null then
    update public.team_members set is_captain = true where team_id = p_team and profile_id = p_profile;
  end if;
end;
$$;

-- The owner hands the team to another member and becomes an admin.
create function public.transfer_team_ownership(p_team uuid, p_profile uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if public.begin_team_change(p_team) is distinct from 'owner' then
    raise exception 'Only the team owner can transfer ownership' using errcode = '42501';
  end if;
  if public.team_member_role(p_team, p_profile) = 'owner' then
    return;
  end if;
  update public.team_members set role = 'admin' where team_id = p_team and profile_id = v_uid;
  update public.team_members set role = 'owner' where team_id = p_team and profile_id = p_profile;
end;
$$;

-- Leaving (the caller's own profile) or removing someone. The owner cannot leave without transferring first.
-- The owner removes anyone else; an admin removes players and staff.
create function public.remove_team_member(p_team uuid, p_profile uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_caller text := public.begin_team_change(p_team);
  v_target text := public.team_member_role(p_team, p_profile);
begin
  if v_target = 'owner' then
    raise exception 'The owner cannot leave or be removed; transfer ownership first' using errcode = '22023';
  end if;
  if p_profile is distinct from (select auth.uid())
    and not (v_caller = 'owner' or (v_caller = 'admin' and v_target in ('player', 'staff'))) then
    raise exception 'You are not allowed to remove this member' using errcode = '42501';
  end if;
  delete from public.team_members where team_id = p_team and profile_id = p_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants and row level security
-- ---------------------------------------------------------------------------

revoke execute on function public.team_role(uuid), public.create_team(uuid, text, text, text, text, text, text),
  public.set_team_member_role(uuid, uuid, text), public.set_team_captain(uuid, uuid),
  public.transfer_team_ownership(uuid, uuid), public.remove_team_member(uuid, uuid) from public, anon;
grant execute on function public.team_role(uuid), public.create_team(uuid, text, text, text, text, text, text),
  public.set_team_member_role(uuid, uuid, text), public.set_team_captain(uuid, uuid),
  public.transfer_team_ownership(uuid, uuid), public.remove_team_member(uuid, uuid) to authenticated;

revoke all on public.teams, public.team_members from anon;
revoke insert, update, delete on public.teams, public.team_members from authenticated;
grant update (name, short_name, tone, logo_url, area, district) on public.teams to authenticated;
grant delete on public.teams to authenticated;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy "teams: signed-in users can read"
  on public.teams for select to authenticated using (true);
create policy "teams: owner and admins can update"
  on public.teams for update to authenticated
  using (public.team_role(id) in ('owner', 'admin')) with check (public.team_role(id) in ('owner', 'admin'));
create policy "teams: owner can delete"
  on public.teams for delete to authenticated using (public.team_role(id) = 'owner');
create policy "team_members: signed-in users can read"
  on public.team_members for select to authenticated using (true);
