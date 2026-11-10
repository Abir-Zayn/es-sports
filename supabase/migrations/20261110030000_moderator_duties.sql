-- Moderator limit 2, and who does what on match day.
--
-- * A tournament has at most 2 moderators (was 3, 20261110000000). The owner is separate and not counted.
-- * `can_stream` / `can_score` on `tournament_staff` are the duties. Default by join order: one moderator does
--   both; with two, the first to join streams and the second scores. Adding or removing a moderator resets the
--   defaults. The owner can then give any moderator either duty or both (`set_moderator_duties`), as long as
--   someone still streams and someone still scores. The owner row never has duties.
-- * Error codes: ET008 moderator limit (unchanged code), 42501 not allowed, 22023 invalid input.

alter table public.tournament_staff
  add column can_stream boolean not null default false,
  add column can_score boolean not null default false,
  add constraint tournament_staff_duties_moderators_only check (role = 'moderator' or (not can_stream and not can_score));

-- Default duties by join order for one tournament.
create function public.apply_default_duties(p_tournament uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  with mods as (
    select user_id, row_number() over (order by added_at, user_id) as n, count(*) over () as total
      from public.tournament_staff where tournament_id = p_tournament and role = 'moderator'
  )
  update public.tournament_staff s
     set can_stream = (m.total = 1 or m.n = 1), can_score = (m.total = 1 or m.n = 2)
    from mods m
   where s.tournament_id = p_tournament and s.user_id = m.user_id;
end $$;
revoke all on function public.apply_default_duties(uuid) from public, anon, authenticated;

create function public.reset_duties_on_staff_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.tournament_staff := case tg_op when 'DELETE' then old else new end;
begin
  if r.role = 'moderator' then perform public.apply_default_duties(r.tournament_id); end if;
  return null;
end $$;
revoke all on function public.reset_duties_on_staff_change() from public, anon, authenticated;

create trigger tournament_staff_default_duties
after insert or delete on public.tournament_staff
for each row execute function public.reset_duties_on_staff_change();

-- Existing tournaments get the defaults too.
do $$ declare t uuid; begin
  for t in select distinct tournament_id from public.tournament_staff where role = 'moderator' loop
    perform public.apply_default_duties(t);
  end loop;
end $$;

create or replace function public.enforce_moderator_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'moderator' then
    perform 1 from public.tournaments where id = new.tournament_id for update;
    if (select count(*) from public.tournament_staff where tournament_id = new.tournament_id and role = 'moderator') >= 2 then
      raise exception 'A tournament can have at most 2 moderators' using errcode = 'ET008';
    end if;
  end if;
  return new;
end $$;

-- Same body as 20261110000000 with the limit at 2.
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
     + (select count(*) from public.invitations where kind = 'tournament_moderator' and tournament_id = p_tournament and status = 'pending') >= 2 then
    raise exception 'A tournament can have at most 2 moderators' using errcode = 'ET008';
  end if;
  insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at)
  values ('tournament_moderator', p_tournament, null, v_uid, p_to, 'pending', now() + interval '7 days') returning id into v_id;
  insert into public.notifications (user_id, kind, title, message, data)
  values (p_to, 'invite', 'Tournament moderator invitation', 'You were invited to moderate a tournament.',
    jsonb_build_object('invitation_id', v_id, 'tournament_id', p_tournament, 'team_id', null, 'status', 'pending'));
  return v_id;
end $$;

-- The owner gives a moderator the streaming duty, the scoring duty, both or neither.
create function public.set_moderator_duties(p_tournament uuid, p_user uuid, p_can_stream boolean, p_can_score boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can assign duties' using errcode = '42501';
  end if;
  update public.tournament_staff set can_stream = coalesce(p_can_stream, false), can_score = coalesce(p_can_score, false)
   where tournament_id = p_tournament and user_id = p_user and role = 'moderator';
  if not found then raise exception 'That person is not a moderator of this tournament' using errcode = '22023'; end if;
  if not exists (select 1 from public.tournament_staff where tournament_id = p_tournament and can_stream)
     or not exists (select 1 from public.tournament_staff where tournament_id = p_tournament and can_score) then
    raise exception 'Someone must stream and someone must score' using errcode = '22023';
  end if;
  -- A streamer who lost the duty drops matches they were lined up for but had not started.
  delete from public.fixture_streamers where tournament_id = p_tournament and streamer_id = p_user and state = 'assigned' and not coalesce(p_can_stream, false);
end $$;

revoke all on function public.set_moderator_duties(uuid, uuid, boolean, boolean) from public, anon;
grant execute on function public.set_moderator_duties(uuid, uuid, boolean, boolean) to authenticated;
