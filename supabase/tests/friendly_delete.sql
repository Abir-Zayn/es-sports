-- Verification for deleting a friendly and the scorer notice (migration 20261102030000).
--
-- Run as an administrator (SQL editor, or psql as postgres) after the migration is applied. Everything runs in one
-- rolled-back transaction; the final block proves nothing persisted. A failed assertion raises 'FAIL ...'.

begin;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'friendly-delete-test-' || u.n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Delete test ' || u.n), now(), now()
from (values (1, 'f6a00000-0000-4000-8000-000000000001'::uuid), (2, 'f6a00000-0000-4000-8000-000000000002'::uuid),
  (3, 'f6a00000-0000-4000-8000-000000000003'::uuid)) u(n, id);
insert into public.profiles (id, full_name)
select id, 'Delete test' from auth.users where email like 'friendly-delete-test-%' on conflict (id) do nothing;

select set_config('t.match', '{"fixture_ref":"friendly-delete-test","team_a_name":"Alpha","team_a_short":"ALP",'
  || '"team_a_tone":"blue","team_b_name":"Beta","team_b_short":"BET","team_b_tone":"yellow","overs_limit":6}', true);
select set_config('t.players', '[{"key":"p1","side":"a","name":"Creator","sort_order":0,"profile_id":"f6a00000-0000-4000-8000-000000000001"},'
  || '{"key":"p2","side":"b","name":"Scorer","sort_order":0,"profile_id":"f6a00000-0000-4000-8000-000000000002"}]', true);

create function public.sfd_as(p_n int) returns void language sql as $$
  select set_config('request.jwt.claims', case when p_n is null then '{"role":"authenticated"}'
    else jsonb_build_object('sub', ('f6a00000-0000-4000-8000-00000000000' || p_n)::text, 'role', 'authenticated')::text end, true);
$$;
create function public.sfd_code(p_sql text) returns text language plpgsql as $$
declare v_code text;
begin
  begin execute p_sql; exception when others then v_code := sqlstate; end;
  return coalesce(v_code, 'ok');
end;
$$;
create function public.sfd_check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin if p_ok is not true then raise exception 'FAIL %', p_label; end if; end;
$$;
grant execute on function public.sfd_as(int), public.sfd_code(text), public.sfd_check(boolean, text) to authenticated;

select public.sfd_as(1);
set local role authenticated;
do $$
declare
  m1 uuid := 'f6b00000-0000-4000-8000-000000000001';  -- scorer assigned
  m2 uuid := 'f6b00000-0000-4000-8000-000000000002';  -- creator scores
  m3 uuid := 'f6b00000-0000-4000-8000-000000000003';  -- finished
  n int;
begin
  perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(m1::text)),
    current_setting('t.players')::jsonb, 'f6a00000-0000-4000-8000-000000000002');
  perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(m2::text)),
    current_setting('t.players')::jsonb, null);
  perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(m3::text)),
    current_setting('t.players')::jsonb, null);

  -- a) the chosen scorer is told, with the match id; the creator and the match without a scorer tell nobody
  perform public.sfd_as(2);
  select count(*) into n from public.notifications
  where kind = 'system' and data ->> 'type' = 'scorer_assigned' and data ->> 'match_id' = m1::text;
  perform public.sfd_check(n = 1, 'a scorer notified once');
  perform public.sfd_as(1);
  select count(*) into n from public.notifications where data ->> 'match_id' in (m1::text, m2::text, m3::text);
  perform public.sfd_check(n = 0, 'a creator sees no notice of their own');

  -- b) only the creator deletes: the scorer, a stranger and a signed-out caller are refused
  for n in 1..3 loop
    perform public.sfd_as(case n when 1 then 2 when 2 then 3 else null end);
    perform public.sfd_check(public.sfd_code(format('select public.delete_friendly_match(%L)', m1)) = '42501', 'b refused ' || n);
  end loop;
  perform public.sfd_as(1);
  perform public.sfd_check((select count(*) from public.matches where id = m1) = 1, 'b match still there');

  -- c) a live match with balls goes with everything attached
  perform public.append_ball_event(jsonb_build_object('id', 'f6c00000-0000-4000-8000-000000000001', 'match_id', m2,
    'innings', 1, 'kind', 'swap_ends'), null);
  perform public.delete_friendly_match(m2);
  perform public.sfd_check(not exists (select 1 from public.matches where id = m2)
    and not exists (select 1 from public.match_players where match_id = m2)
    and not exists (select 1 from public.ball_events where match_id = m2), 'c cascade');

  -- d) the creator deletes a match whose scorer is someone else; the scorer's notice goes too; a repeat is OK
  perform public.delete_friendly_match(m1);
  perform public.sfd_check(not exists (select 1 from public.match_scorers where match_id = m1), 'd scorer row gone');
  perform public.sfd_check(public.sfd_code(format('select public.delete_friendly_match(%L)', m1)) = 'ok', 'd repeat ok');
  perform public.sfd_check(public.sfd_code('select public.delete_friendly_match(null)') = '42501', 'd null id');
  perform public.sfd_as(2);
  perform public.sfd_check(not exists (select 1 from public.notifications where data ->> 'match_id' = m1::text), 'd notice removed');

  -- e) a finished match keeps its record: finish m3 the real way, then the delete is refused
  perform public.sfd_as(1);
  perform public.save_match_result(m3, ('{"completed_at":"2026-11-01T12:00:00Z","team_a_runs":40,"team_a_wickets":1,"team_a_balls":12,'
    || '"team_b_runs":30,"team_b_wickets":2,"team_b_balls":12,"winner_side":"a","result_type":"runs","result_margin":10,'
    || '"result_summary":"Alpha won"}')::jsonb, 'f6c00000-0000-4000-8000-000000000002', null);
  perform public.sfd_check(public.sfd_code(format('select public.delete_friendly_match(%L)', m3)) = 'ED001', 'e finished refused');

  -- f) direct deletes stay revoked
  perform public.sfd_check(public.sfd_code(format('delete from public.matches where id = %L', m3)) = '42501', 'f direct delete refused');
end $$;
reset role;
rollback;
do $$
begin
  if exists (select 1 from auth.users where email like 'friendly-delete-test-%')
    or exists (select 1 from public.matches where id::text like 'f6b00000-0000-4000-8000-%')
    or to_regprocedure('public.sfd_check(boolean, text)') is not null then
    raise exception 'FAIL cleanup: fixture rows or helpers persisted';
  end if;
end $$;
select 'friendly_delete verification passed' as result;
