-- Verification for team player invitations (migration 20261102060000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Fixture accounts: 1 owner of team P, 2 admin of P, 3 invited player, 4 stranger, 5 player of team Q, which plays
-- in tournament T together with P.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f8a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'team-invite-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Team invite test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Team invite test' from auth.users where email like 'team-invite-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.send_team_player_invite(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.send_team_player_invite(uuid, uuid)', 'execute') then
    raise exception 'FAIL grants: send_team_player_invite is for authenticated only';
  end if;
end $$;

-- Team P (owner 1, admin 2) and team Q (owner 1, player 5), both entered in tournament T owned by 1.
select set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select public.create_tournament(jsonb_build_object('id', 'f8c00000-0000-4000-8000-000000000001', 'name', 'Invite Test Cup',
  'city', 'Chattogram', 'venue', 'Main Ground', 'start_date', current_date + 7, 'end_date', current_date + 9, 'match_format', 'T20',
  'competition', 'league', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'standard_11', 'players_per_side', 11,
  'min_squad', 11, 'max_squad', 16));
select public.create_tournament_team('f8c00000-0000-4000-8000-000000000001', 'f8b00000-0000-4000-8000-00000000000a', 'Papa XI', 'PXI', 'neutral');
select public.create_tournament_team('f8c00000-0000-4000-8000-000000000001', 'f8b00000-0000-4000-8000-00000000000b', 'Quebec XI', 'QXI', 'neutral');
reset role;
insert into public.team_members (team_id, profile_id, role) values
  ('f8b00000-0000-4000-8000-00000000000a', 'f8a00000-0000-4000-8000-000000000001', 'owner'),
  ('f8b00000-0000-4000-8000-00000000000b', 'f8a00000-0000-4000-8000-000000000001', 'owner'),
  ('f8b00000-0000-4000-8000-00000000000a', 'f8a00000-0000-4000-8000-000000000002', 'admin'),
  ('f8b00000-0000-4000-8000-00000000000b', 'f8a00000-0000-4000-8000-000000000005', 'player');
set local role authenticated;

do $$
declare inv uuid; inv2 uuid; code text;
  p uuid := 'f8b00000-0000-4000-8000-00000000000a';
  as_user text := '{"sub":"f8a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
begin
  -- a) Owner invites 3: stored with no tournament, one notification; a repeat is EI002.
  inv := public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000003');
  if (select tournament_id is not null or kind <> 'team_player' from public.invitations where id = inv) then
    raise exception 'FAIL a: wrong invitation row';
  end if;
  begin perform public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000003'); exception when others then code := sqlstate; end;
  if code is distinct from 'EI002' then raise exception 'FAIL a: repeat gave %', code; end if;

  -- b) Inviting yourself, an existing member, or (as a stranger) anyone is refused.
  code := null;
  begin perform public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000001'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL b: self gave %', code; end if;
  code := null;
  begin perform public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000002'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL b: member gave %', code; end if;
  perform set_config('request.jwt.claims', format(as_user, 4), true);
  code := null;
  begin perform public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000005'); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL b: stranger gave %', code; end if;

  -- c) Account 5 plays for Q in T, so inviting them to P (also in T) is ET002.
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  code := null;
  begin perform public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000005'); exception when others then code := sqlstate; end;
  if code is distinct from 'ET002' then raise exception 'FAIL c: player of another team in T gave %', code; end if;

  -- d) Account 3 accepts and joins P as a player; the owner hears back.
  perform set_config('request.jwt.claims', format(as_user, 3), true);
  perform public.accept_invitation(inv);
  if not exists (select 1 from public.team_members where team_id = p and profile_id = 'f8a00000-0000-4000-8000-000000000003' and role = 'player') then
    raise exception 'FAIL d: account 3 did not join as a player';
  end if;

  -- e) The admin invites 4; the admin is then removed, so acceptance is EI003. Then a decline works.
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  inv2 := public.send_team_player_invite(p, 'f8a00000-0000-4000-8000-000000000004');
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  perform public.remove_team_member(p, 'f8a00000-0000-4000-8000-000000000002');
  perform set_config('request.jwt.claims', format(as_user, 4), true);
  code := null;
  begin perform public.accept_invitation(inv2); exception when others then code := sqlstate; end;
  if code is distinct from 'EI003' then raise exception 'FAIL e: accept after sender removed gave %', code; end if;
  perform public.decline_invitation(inv2);
end $$;

reset role;
do $$
begin
  if not exists (select 1 from public.notifications where user_id = 'f8a00000-0000-4000-8000-000000000001' and kind = 'invite_response'
      and data ->> 'status' = 'accepted') then
    raise exception 'FAIL d: the owner got no accepted notice';
  end if;
end $$;
select 'PASS team player invitations' as result;
rollback;
