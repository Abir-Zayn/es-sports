-- A tournament has at most 3 moderators (the streamers and scorers the owner can rely on).
--
-- * Trigger `tournament_staff_moderator_cap`: a 4th `moderator` row is refused (ET008) whatever path inserts it
--   (accept_invitation today, anything later). The tournament row is locked first so two simultaneous accepts
--   cannot both pass the count.
-- * `send_tournament_moderator_invite` is redefined (body of 20261102020000 plus one check): moderators already
--   in the tournament plus open invitations may not exceed 3, so the owner learns at invite time, not when the
--   last person taps Accept.
-- Error code: ET008 moderator limit reached.

create function public.enforce_moderator_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'moderator' then
    perform 1 from public.tournaments where id = new.tournament_id for update;
    if (select count(*) from public.tournament_staff where tournament_id = new.tournament_id and role = 'moderator') >= 3 then
      raise exception 'A tournament can have at most 3 moderators' using errcode = 'ET008';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_moderator_cap() from public, anon, authenticated;

create trigger tournament_staff_moderator_cap
before insert on public.tournament_staff
for each row execute function public.enforce_moderator_cap();

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
  if (select count(*) from public.tournament_staff where tournament_id = p_tournament and role = 'moderator')
     + (select count(*) from public.invitations where kind = 'tournament_moderator' and tournament_id = p_tournament and status = 'pending') >= 3 then
    raise exception 'A tournament can have at most 3 moderators' using errcode = 'ET008';
  end if;
  insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at)
  values ('tournament_moderator', p_tournament, null, v_uid, p_to, 'pending', now() + interval '7 days') returning id into v_id;
  insert into public.notifications (user_id, kind, title, message, data)
  values (p_to, 'invite', 'Tournament moderator invitation', 'You were invited to moderate a tournament.',
    jsonb_build_object('invitation_id', v_id, 'tournament_id', p_tournament, 'team_id', null, 'status', 'pending'));
  return v_id;
end $$;

revoke all on function public.send_tournament_moderator_invite(uuid, uuid) from public, anon;
grant execute on function public.send_tournament_moderator_invite(uuid, uuid) to authenticated;
