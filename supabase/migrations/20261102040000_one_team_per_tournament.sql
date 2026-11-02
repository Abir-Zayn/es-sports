-- One team per person per tournament.
--
-- * A person may own or play for any number of teams, and enter any number of tournaments. Inside one tournament,
--   though, they belong to one team only. "Belong" means a `team_members` row with role `owner` or `player` in a
--   team entered in that tournament. Owning and playing for the same team is fine. `admin` and `staff` manage a
--   team and do not count, so a former owner kept as admin (see `accept_invitation`) is not blocked.
-- * Exemption: the tournament's own staff (owner or moderator) owning a team they created. `create_tournament_team`
--   makes the staff member who creates a team its owner until an invited owner accepts, so staff can hold that
--   placeholder ownership of several teams in their tournament. Ownership taken through an invitation, and every
--   `player` row, follow the same rule as everyone.
-- * Enforced by triggers, so every path is covered: an accepted owner invitation, a role change, a team entered
--   into a tournament. `send_team_owner_invite` checks too, so the organiser hears about it before inviting.
-- * Two changes for one person are serialised with a transaction advisory lock on their id, so two teams cannot
--   take the same person at once.
-- * Error code ET002: already with another team in this tournament.

-- The tournament in which `p_profile`, taking `p_role` in `p_team`, would belong to a second team; null when none.
create function public.tournament_team_clash(p_team uuid, p_profile uuid, p_role text) returns uuid
language sql stable security definer set search_path = '' as $$
  select tt.tournament_id
  from public.tournament_teams tt
  join public.teams this_team on this_team.id = tt.team_id
  join public.tournament_teams other on other.tournament_id = tt.tournament_id and other.team_id <> tt.team_id
  join public.teams other_team on other_team.id = other.team_id
  join public.team_members m on m.team_id = other.team_id and m.profile_id = p_profile and m.role in ('owner', 'player')
  left join public.tournament_staff s on s.tournament_id = tt.tournament_id and s.user_id = p_profile
  where tt.team_id = p_team
    and p_role in ('owner', 'player')
    -- Staff owning a team they created is a placeholder until an invited owner accepts, not membership.
    and not (s.user_id is not null and p_role = 'owner' and this_team.created_by = p_profile)
    and not (s.user_id is not null and m.role = 'owner' and other_team.created_by = p_profile)
  limit 1;
$$;
revoke all on function public.tournament_team_clash(uuid, uuid, text) from public, anon, authenticated;

create function public.raise_tournament_team_clash(p_team uuid, p_profile uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('team-membership:' || p_profile::text, 0));
  if public.tournament_team_clash(p_team, p_profile, p_role) is not null then
    raise exception 'This player is already with another team in this tournament' using errcode = 'ET002';
  end if;
end;
$$;
revoke all on function public.raise_tournament_team_clash(uuid, uuid, text) from public, anon, authenticated;

-- A member joins a team, or changes role.
create function public.team_members_one_team_per_tournament() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role in ('owner', 'player') then
    perform public.raise_tournament_team_clash(new.team_id, new.profile_id, new.role);
  end if;
  return new;
end;
$$;
revoke all on function public.team_members_one_team_per_tournament() from public, anon, authenticated;

create trigger team_members_one_team_per_tournament
  after insert or update of role on public.team_members
  for each row execute function public.team_members_one_team_per_tournament();

-- A team enters a tournament: none of its owners or players may already belong to another team there.
create function public.tournament_teams_one_team_per_member() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_member record;
begin
  for v_member in
    select profile_id, role from public.team_members where team_id = new.team_id and role in ('owner', 'player') order by profile_id
  loop
    perform public.raise_tournament_team_clash(new.team_id, v_member.profile_id, v_member.role);
  end loop;
  return new;
end;
$$;
revoke all on function public.tournament_teams_one_team_per_member() from public, anon, authenticated;

create trigger tournament_teams_one_team_per_member
  after insert on public.tournament_teams
  for each row execute function public.tournament_teams_one_team_per_member();

-- Same as 20261102020000, plus the ET002 check on the recipient before the invitation is stored.
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
  if public.tournament_team_clash(p_team, p_to, 'owner') is not null then
    raise exception 'This player is already with another team in this tournament' using errcode = 'ET002';
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
