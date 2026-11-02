-- One playing team per person per tournament; owning several teams is allowed.
--
-- * Client request after 20261102040000: the same person may be invited to own, and may own, several teams in one
--   tournament. What they may not do is play for more than one team there. So only the `player` role counts now;
--   `owner`, `admin` and `staff` are free. Across tournaments nothing is limited.
-- * With owners no longer counted, the staff placeholder exemption of 20261102040000 is not needed and is dropped.
-- * `send_team_owner_invite` goes back to its 20261102020000 body: an owner invitation never clashes.
-- * Still enforced by the same triggers (team_members insert or role change, tournament_teams insert), serialised
--   per person by the advisory lock in `raise_tournament_team_clash`. Error code ET002.

-- The tournament in which `p_profile`, playing for `p_team`, would play for a second team; null when none.
create or replace function public.tournament_team_clash(p_team uuid, p_profile uuid, p_role text) returns uuid
language sql stable security definer set search_path = '' as $$
  select tt.tournament_id
  from public.tournament_teams tt
  join public.tournament_teams other on other.tournament_id = tt.tournament_id and other.team_id <> tt.team_id
  join public.team_members m on m.team_id = other.team_id and m.profile_id = p_profile and m.role = 'player'
  where tt.team_id = p_team and p_role = 'player'
  limit 1;
$$;

create or replace function public.raise_tournament_team_clash(p_team uuid, p_profile uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('team-membership:' || p_profile::text, 0));
  if public.tournament_team_clash(p_team, p_profile, p_role) is not null then
    raise exception 'This player already plays for another team in this tournament' using errcode = 'ET002';
  end if;
end;
$$;

create or replace function public.team_members_one_team_per_tournament() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'player' then
    perform public.raise_tournament_team_clash(new.team_id, new.profile_id, new.role);
  end if;
  return new;
end;
$$;

create or replace function public.tournament_teams_one_team_per_member() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_member record;
begin
  for v_member in
    select profile_id, role from public.team_members where team_id = new.team_id and role = 'player' order by profile_id
  loop
    perform public.raise_tournament_team_clash(new.team_id, v_member.profile_id, v_member.role);
  end loop;
  return new;
end;
$$;

-- Same body as 20261102020000: owning a team never clashes, so no ET002 check here.
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
