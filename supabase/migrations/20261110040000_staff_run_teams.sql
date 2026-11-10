-- Teams have no owner: the tournament owner and moderators run them.
--
-- * `team_role(team)` now answers 'owner' for anyone on the staff of a tournament the team plays in, and otherwise
--   the caller's own membership role (a player). Every function and policy that asked "is the caller the team
--   owner or an admin?" (squads, player invitations, availability, removing a member, captain, team edits) therefore
--   now means "is the caller tournament staff?" with no further change to them.
-- * Players are invited by staff (`send_team_player_invite`, unchanged). `accept_invitation` now checks that the
--   sender is staff of a tournament the team plays in, since the sender is no longer a team member.
-- * Retired: the team-owner invitation (`send_team_owner_invite` dropped; an old one can no longer be accepted),
--   standalone team creation (`create_team`), ownership transfer and promoting members to admin. Teams exist only
--   inside a tournament and are made by `create_tournament_team`.
-- * Reschedule and cancel notices now go to the team's players, since there is no owner to tell.
-- * Data: owner and admin membership rows and every team-owner invitation are deleted; players stay.

create or replace function public.team_role(p_team uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.tournament_teams tt join public.tournament_staff s on s.tournament_id = tt.tournament_id
                  where tt.team_id = p_team and s.user_id = (select auth.uid())) then 'owner'
    else (select m.role from public.team_members m where m.team_id = p_team and m.profile_id = (select auth.uid()))
  end
$$;

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
    if not exists (select 1 from public.tournament_teams tt join public.tournament_staff s on s.tournament_id = tt.tournament_id
                    where tt.team_id = v_inv.team_id and s.user_id = v_inv.from_user) then
      raise exception 'The sender can no longer add members to this team' using errcode = 'EI003';
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
end $$;

create or replace function public.notify_fixture_teams(p_fixture uuid, p_title text, p_message text, p_event text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, message, data)
  select m.profile_id, 'system', p_title, p_message,
    jsonb_build_object('tournament_id', f.tournament_id, 'fixture_id', f.id, 'team_id', m.team_id, 'event', p_event)
  from public.tournament_fixtures f
  join public.team_members m on m.team_id in (f.home_team_id, f.away_team_id) and m.role = 'player'
  where f.id = p_fixture and m.profile_id is distinct from (select auth.uid());
$$;

drop function public.send_team_owner_invite(uuid, uuid, uuid);
revoke execute on function public.create_team(uuid, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.transfer_team_ownership(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.set_team_member_role(uuid, uuid, text) from public, anon, authenticated;

delete from public.invitations where kind = 'team_owner';
delete from public.team_members where role in ('owner', 'admin');
