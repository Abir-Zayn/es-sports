-- Rolled-back verification for Step 11 (Job 2) invitations and notifications.
begin;

create or replace function pg_temp.inv_uid(p_slot int) returns uuid language sql immutable as $$
  select ('20000000-0000-4000-8000-00000000000' || p_slot::text)::uuid;
$$;

create or replace function pg_temp.inv_as(p_slot int) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', pg_temp.inv_uid(p_slot)::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', pg_temp.inv_uid(p_slot), 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.inv_assert(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL [%]', p_label; end if;
end $$;

create or replace function pg_temp.inv_err(p_sql text, p_code text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate = p_code then return; end if;
    raise exception 'FAIL [%]: expected %, got % (%)', p_label, p_code, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL [%]: expected %, succeeded', p_label, p_code;
end $$;

do $$
declare
  v_tour uuid := '21000000-0000-4000-8000-000000000001'::uuid;
  v_team1 uuid := '22000000-0000-4000-8000-000000000001'::uuid;
  v_team2 uuid := '22000000-0000-4000-8000-000000000002'::uuid;
  v_team3 uuid := '22000000-0000-4000-8000-000000000003'::uuid;
  v_inv uuid;
  v_inv2 uuid;
  v_notif uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
  select pg_temp.inv_uid(s), 'inv' || s || '@test.local', jsonb_build_object('name', 'InvUser ' || s), now(), now()
  from generate_series(1, 5) as s;

  -- 1. Grants, direct write denials, and realtime publication
  perform pg_temp.inv_assert(not has_table_privilege('anon', 'public.invitations', 'SELECT'), 'anon no invitations select');
  perform pg_temp.inv_assert(not has_table_privilege('anon', 'public.notifications', 'SELECT'), 'anon no notifications select');
  perform pg_temp.inv_assert(not has_table_privilege('authenticated', 'public.invitations', 'INSERT'), 'auth no invitations insert');
  perform pg_temp.inv_assert(not has_table_privilege('authenticated', 'public.invitations', 'UPDATE'), 'auth no invitations update');
  perform pg_temp.inv_assert(not has_table_privilege('authenticated', 'public.invitations', 'DELETE'), 'auth no invitations delete');
  perform pg_temp.inv_assert(not has_table_privilege('authenticated', 'public.notifications', 'INSERT'), 'auth no notifications insert');
  perform pg_temp.inv_assert(not has_table_privilege('authenticated', 'public.notifications', 'UPDATE'), 'auth no notifications update');
  perform pg_temp.inv_assert(not has_table_privilege('authenticated', 'public.notifications', 'DELETE'), 'auth no notifications delete');
  perform pg_temp.inv_assert(exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ), 'notifications in supabase_realtime');

  -- Fixtures via tournament RPCs: user 1 creates tournament, team1, team3
  perform pg_temp.inv_as(1);
  perform public.create_tournament(jsonb_build_object(
    'id', v_tour, 'name', 'Invite Cup', 'city', 'Dhaka', 'venue', 'Mirpur',
    'startDate', '2027-02-01', 'endDate', '2027-02-10', 'start_date', '2027-02-01', 'end_date', '2027-02-10',
    'matchFormat', 'T20', 'match_format', 'T20', 'competition', 'league-knockout',
    'teams', 8, 'teams_planned', 8, 'ball', 'Tennis', 'sideFormat', 'standard_11', 'side_format', 'standard_11',
    'playersPerSide', 11, 'players_per_side', 11, 'minSquad', 11, 'min_squad', 11, 'maxSquad', 15, 'max_squad', 15,
    'registrationOpens', '', 'registrationDeadline', '', 'overs', '', 'organizerName', 'Org', 'organizerPhone', '',
    'organizerEmail', '', 'entryFee', '', 'prizeDetails', '', 'rulesSummary', ''
  ));
  perform public.create_tournament_team(v_tour, v_team1, 'Owner Lions', 'OLI', 'blue');
  perform public.create_tournament_team(v_tour, v_team3, 'Owner Royals', 'ORY', 'yellow');

  -- 2. Send moderator invite by owner, duplicate pending EI002, accept adds staff + notifications, moderator cannot invite moderator
  v_inv := public.send_tournament_moderator_invite(v_tour, pg_temp.inv_uid(2));
  perform pg_temp.inv_err(format('select public.send_tournament_moderator_invite(%L, %L)', v_tour, pg_temp.inv_uid(2)), 'EI002', 'duplicate mod invite EI002');

  -- Stranger (user 5) cannot read, accept, decline, or cancel
  perform pg_temp.inv_as(5);
  perform pg_temp.inv_assert((select count(*) from public.invitations where id = v_inv) = 0, 'stranger sees 0 invitations');
  perform pg_temp.inv_assert((select count(*) from public.notifications) = 0, 'stranger sees 0 notifications');
  perform pg_temp.inv_err(format('select public.accept_invitation(%L)', v_inv), '42501', 'stranger accept 42501');
  perform pg_temp.inv_err(format('select public.decline_invitation(%L)', v_inv), '42501', 'stranger decline 42501');
  perform pg_temp.inv_err(format('select public.cancel_invitation(%L)', v_inv), '42501', 'stranger cancel 42501');

  -- User 2 sees invite notification, accepts moderator invite, and repeat accept is idempotent
  perform pg_temp.inv_as(2);
  perform pg_temp.inv_assert(exists (
    select 1 from public.notifications where user_id = pg_temp.inv_uid(2) and kind = 'invite' and read_at is null and data ->> 'invitation_id' = v_inv::text
  ), 'mod invite notification created');
  perform public.accept_invitation(v_inv);
  perform public.accept_invitation(v_inv);
  perform pg_temp.inv_assert(exists (
    select 1 from public.tournament_staff where tournament_id = v_tour and user_id = pg_temp.inv_uid(2) and role = 'moderator'
  ), 'user 2 added as moderator');
  perform pg_temp.inv_assert(exists (
    select 1 from public.notifications where user_id = pg_temp.inv_uid(2) and kind = 'invite' and read_at is not null and data ->> 'status' = 'accepted'
  ), 'mod invite notification marked read');

  -- Moderator (user 2) cannot send moderator invite (42501); owner cannot invite already-staff user 2 (22023)
  perform pg_temp.inv_err(format('select public.send_tournament_moderator_invite(%L, %L)', v_tour, pg_temp.inv_uid(3)), '42501', 'moderator cannot invite moderator');
  perform pg_temp.inv_as(1);
  perform pg_temp.inv_assert(exists (
    select 1 from public.notifications where user_id = pg_temp.inv_uid(1) and kind = 'invite_response' and data ->> 'invitation_id' = v_inv::text and data ->> 'status' = 'accepted'
  ), 'sender received accepted invite_response');
  perform pg_temp.inv_err(format('select public.send_tournament_moderator_invite(%L, %L)', v_tour, pg_temp.inv_uid(2)), '22023', 'cannot invite existing staff');

  -- 3. Send & accept team_owner invite by owner (user 1 -> user 3 on team1) and by moderator (user 2 -> user 4 on team2)
  v_inv := public.send_team_owner_invite(v_tour, v_team1, pg_temp.inv_uid(3));
  perform pg_temp.inv_err(format('select public.send_team_owner_invite(%L, %L, %L)', v_tour, v_team1, pg_temp.inv_uid(3)), 'EI002', 'duplicate team_owner invite EI002');
  perform pg_temp.inv_as(3);
  perform public.accept_invitation(v_inv);
  perform public.accept_invitation(v_inv);
  perform pg_temp.inv_assert(exists (
    select 1 from public.team_members where team_id = v_team1 and profile_id = pg_temp.inv_uid(3) and role = 'owner'
  ) and exists (
    select 1 from public.team_members where team_id = v_team1 and profile_id = pg_temp.inv_uid(1) and role = 'admin'
  ), 'team1 ownership moved to user 3 and user 1 demoted to admin');

  perform pg_temp.inv_as(2);
  perform public.create_tournament_team(v_tour, v_team2, 'Mod Tigers', 'MTG', 'blue');
  -- Moderator does not own team3 -> EI003
  perform pg_temp.inv_err(format('select public.send_team_owner_invite(%L, %L, %L)', v_tour, v_team3, pg_temp.inv_uid(3)), 'EI003', 'non-owner send_team_owner_invite EI003');
  v_inv2 := public.send_team_owner_invite(v_tour, v_team2, pg_temp.inv_uid(4));
  perform pg_temp.inv_as(4);
  perform public.accept_invitation(v_inv2);
  perform pg_temp.inv_assert(exists (
    select 1 from public.team_members where team_id = v_team2 and profile_id = pg_temp.inv_uid(4) and role = 'owner'
  ) and exists (
    select 1 from public.team_members where team_id = v_team2 and profile_id = pg_temp.inv_uid(2) and role = 'admin'
  ), 'team2 ownership moved to user 4 and user 2 demoted to admin');

  -- 4. Sender no longer owns team at accept -> EI003
  perform pg_temp.inv_as(1);
  v_inv := public.send_team_owner_invite(v_tour, v_team3, pg_temp.inv_uid(3));
  set local role postgres;
  insert into public.team_members (team_id, profile_id, role) values (v_team3, pg_temp.inv_uid(5), 'player');
  perform pg_temp.inv_as(1);
  perform public.transfer_team_ownership(v_team3, pg_temp.inv_uid(5));
  perform pg_temp.inv_as(3);
  perform pg_temp.inv_err(format('select public.accept_invitation(%L)', v_inv), 'EI003', 'accept when sender lost ownership EI003');

  -- 5. Decline, cancel, and expiry (EI001) + lazy expiry on re-send
  perform pg_temp.inv_as(1);
  v_inv := public.send_tournament_moderator_invite(v_tour, pg_temp.inv_uid(3));
  perform pg_temp.inv_as(3);
  perform public.decline_invitation(v_inv);
  perform public.decline_invitation(v_inv);
  perform pg_temp.inv_err(format('select public.accept_invitation(%L)', v_inv), 'EI001', 'accept after decline EI001');

  perform pg_temp.inv_as(1);
  v_inv := public.send_tournament_moderator_invite(v_tour, pg_temp.inv_uid(3));
  perform public.cancel_invitation(v_inv);
  perform public.cancel_invitation(v_inv);
  perform pg_temp.inv_as(3);
  perform pg_temp.inv_err(format('select public.accept_invitation(%L)', v_inv), 'EI001', 'accept after cancel EI001');

  perform pg_temp.inv_as(1);
  v_inv := public.send_tournament_moderator_invite(v_tour, pg_temp.inv_uid(3));
  set local role postgres;
  update public.invitations set expires_at = now() - interval '1 minute' where id = v_inv;
  perform pg_temp.inv_as(3);
  perform pg_temp.inv_err(format('select public.accept_invitation(%L)', v_inv), 'EI001', 'accept expired EI001');
  perform pg_temp.inv_as(1);
  v_inv2 := public.send_tournament_moderator_invite(v_tour, pg_temp.inv_uid(3));
  perform pg_temp.inv_assert((select status from public.invitations where id = v_inv) = 'expired', 'lazy expiry marked old invite expired');

  -- 6. mark_notifications_read marks only caller's own notifications
  select id into v_notif from public.notifications where user_id = pg_temp.inv_uid(1) and read_at is null limit 1;
  perform pg_temp.inv_assert(v_notif is not null, 'user 1 has unread notification');
  perform pg_temp.inv_as(3);
  perform public.mark_notifications_read(array[v_notif]);
  set local role postgres;
  perform pg_temp.inv_assert((select read_at from public.notifications where id = v_notif) is null, 'user 3 cannot mark user 1 notification read');
  perform pg_temp.inv_as(1);
  perform public.mark_notifications_read(array[v_notif]);
  perform pg_temp.inv_assert((select read_at from public.notifications where id = v_notif) is not null, 'user 1 marked specific notification read');
  perform public.mark_notifications_read();
  perform pg_temp.inv_assert(not exists (
    select 1 from public.notifications where user_id = pg_temp.inv_uid(1) and read_at is null
  ), 'user 1 marked all notifications read');
end $$;

rollback;

do $$
begin
  if exists (select 1 from public.invitations where tournament_id = '21000000-0000-4000-8000-000000000001'::uuid) then
    raise exception 'FAIL [rollback]: test invitations persisted';
  end if;
end $$;

select 'invitations verification passed' as result;
