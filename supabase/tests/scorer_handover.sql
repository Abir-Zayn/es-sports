-- Verification for scorer handover and creator recovery (migration 20261101030000).
--
-- Run as an administrator (SQL editor, or psql as postgres) after the migration is applied. Everything,
-- including the sht_ test helpers, runs inside one rolled-back transaction; the final block proves nothing
-- persisted. Any failed assertion raises an exception starting with FAIL, and the script ends with a select.
--
-- Two-session check by hand (not automatable in one session):
--   Setup: friendly match M with scorer A and a pending handover H to user B; current score_head is S.
--   Session A: begin; set local role authenticated;
--     select set_config('request.jwt.claims', '{"sub":"<A id>","role":"authenticated"}', true);
--     select public.append_ball_event('<event json for M, id E1>', '<S>');  -- leave uncommitted (holds lock)
--   Session B: begin; set local role authenticated;
--     select set_config('request.jwt.claims', '{"sub":"<B id>","role":"authenticated"}', true);
--     select public.accept_scorer_handover('<H>');  -- waits on score_match:<M> advisory lock
--   Commit Session A, then commit Session B: both succeed in order.
--   Session A (new tx, same claims): select public.append_ball_event('<event json for M, id E2>', '<E1>');
--     -> fails with SQLSTATE 42501 because B is now the sole scorer.

begin;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'scorer-handover-test-' || u.n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Handover test ' || u.n), now(), now()
from (values (1, 'f3e00000-0000-4000-8000-000000000001'::uuid), (2, 'f3e00000-0000-4000-8000-000000000002'::uuid),
  (3, 'f3e00000-0000-4000-8000-000000000003'::uuid), (4, 'f3e00000-0000-4000-8000-000000000004'::uuid),
  (5, 'f3e00000-0000-4000-8000-000000000005'::uuid)) u(n, id);
insert into public.profiles (id, full_name)
select id, 'Handover test' from auth.users where email like 'scorer-handover-test-%' on conflict (id) do nothing;
delete from public.profiles where id = 'f3e00000-0000-4000-8000-000000000005';
create function public.sht_id(p_prefix text, p_n int) returns uuid language sql immutable as $$
  select case when p_n is null then null else (p_prefix || '-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid end;
$$;
create function public.sht_u(p_n int) returns uuid language sql immutable as $$ select public.sht_id('f3e00000', p_n) $$;
create function public.sht_m(p_n int) returns uuid language sql immutable as $$ select public.sht_id('f3e10000', p_n) $$;
create function public.sht_e(p_n int) returns uuid language sql immutable as $$ select public.sht_id('f3e20000', p_n) $$;
create function public.sht_as(p_n int) returns void language sql as $$
  select set_config('request.jwt.claims', case when p_n is null then '{"role":"authenticated"}'
    else jsonb_build_object('sub', public.sht_u(p_n)::text, 'role', 'authenticated')::text end, true);
$$;
create function public.sht_expect(p_sql text, p_code text, p_label text) returns void language plpgsql as $$
declare v_code text;
begin
  begin execute p_sql; exception when others then v_code := sqlstate; end;
  if v_code is distinct from p_code then
    raise exception 'FAIL %: expected %, got %', p_label, coalesce(p_code, 'success'), coalesce(v_code, 'success');
  end if;
end;
$$;
create function public.sht_fail(p_ok boolean, p_label text) returns void language plpgsql as $$
begin if not p_ok then raise exception 'FAIL %', p_label; end if; end;
$$;
create function public.sht_offer(p_as int, p_m int, p_to int, p_code text, p_label text) returns uuid language plpgsql as $$
declare v_id uuid; v_code text;
begin
  perform public.sht_as(p_as);
  begin v_id := public.offer_scorer_handover(public.sht_m(p_m), public.sht_u(p_to)); exception when others then v_code := sqlstate; end;
  if v_code is distinct from p_code then
    raise exception 'FAIL %: expected %, got %', p_label, coalesce(p_code, 'success'), coalesce(v_code, 'success');
  end if;
  return v_id;
end;
$$;
create function public.sht_act(p_as int, p_fn text, p_id uuid, p_code text, p_label text) returns void language plpgsql as $$
begin perform public.sht_as(p_as); perform public.sht_expect(format('select public.%I(%L::uuid)', p_fn, p_id), p_code, p_label); end;
$$;
create function public.sht_append(p_as int, p_ev int, p_match int, p_head int, p_code text, p_label text) returns void language plpgsql as $$
begin
  perform public.sht_as(p_as);
  perform public.sht_expect(format('select public.append_ball_event(%L::jsonb, %L::uuid)',
    jsonb_build_object('id', public.sht_e(p_ev), 'match_id', public.sht_m(p_match), 'innings', 1, 'kind', 'swap_ends'),
    public.sht_e(p_head)), p_code, p_label);
end;
$$;
create function public.sht_expire(p_id uuid) returns void language sql security definer set search_path = '' as $$
  update public.scorer_handover set expires_at = now() - interval '1 second', created_at = now() - interval '16 minutes' where id = p_id;
$$;
create function public.sht_age_balls(p_match int, p_interval interval) returns void language sql security definer set search_path = '' as $$
  update public.ball_events set created_at = now() - p_interval where match_id = public.sht_m(p_match);
$$;
grant execute on function public.sht_id(text, int), public.sht_u(int), public.sht_m(int), public.sht_e(int),
  public.sht_as(int), public.sht_expect(text, text, text), public.sht_fail(boolean, text),
  public.sht_offer(int, int, int, text, text), public.sht_act(int, text, uuid, text, text),
  public.sht_append(int, int, int, int, text, text), public.sht_expire(uuid), public.sht_age_balls(int, interval) to authenticated;
do $$
declare f text;
begin
  foreach f in array array['public.offer_scorer_handover(uuid, uuid)', 'public.accept_scorer_handover(uuid)',
    'public.decline_scorer_handover(uuid)', 'public.cancel_scorer_handover(uuid)'] loop
    perform public.sht_fail(not has_function_privilege('anon', f, 'execute')
      and has_function_privilege('authenticated', f, 'execute'), 'grants on ' || f);
  end loop;
  perform public.sht_fail(not has_table_privilege('anon', 'public.scorer_handover', 'select')
    and has_table_privilege('authenticated', 'public.scorer_handover', 'select')
    and not has_table_privilege('authenticated', 'public.scorer_handover', 'insert')
    and not has_table_privilege('authenticated', 'public.scorer_handover', 'update')
    and not has_table_privilege('authenticated', 'public.scorer_handover', 'delete'), 'table grants');
  perform public.sht_fail(exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scorer_handover'), 'realtime');
end $$;
select set_config('t.match', '{"fixture_ref":"friendly-handover-test","team_a_name":"Alpha","team_a_short":"ALP",'
  || '"team_a_tone":"blue","team_b_name":"Beta","team_b_short":"BET","team_b_tone":"yellow","overs_limit":6}', true);
select set_config('t.players', '[{"key":"p1","side":"a","name":"Creator","sort_order":0,"profile_id":"f3e00000-0000-4000-8000-000000000001"},'
  || '{"key":"p2","side":"b","name":"Scorer","sort_order":0,"profile_id":"f3e00000-0000-4000-8000-000000000002"},'
  || '{"key":"p3","side":"a","name":"Target","sort_order":1,"profile_id":"f3e00000-0000-4000-8000-000000000003"}]', true);
select public.sht_as(1);
set local role authenticated;
do $$
begin
  perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(public.sht_m(1)::text)),
    current_setting('t.players')::jsonb, public.sht_u(2));
  perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(public.sht_m(2)::text)),
    current_setting('t.players')::jsonb, null);
  insert into public.matches (id, fixture_ref, created_by, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short, team_b_tone, status)
  values (public.sht_m(3), 'tournament-handover-test', public.sht_u(1), 'Alpha', 'ALP', 'blue', 'Beta', 'BET', 'yellow', 'live');
end $$;
-- a-j) Handover offer/accept, permissions, decline/cancel/expiry, duplicate pending, creator takeover,
-- scorer change, completed/non-friendly matches, idempotent repeats, direct table writes/RLS, and single-scorer trigger.
do $$
declare v_h1 uuid; v_dec uuid; v_can1 uuid; v_can2 uuid; v_can3 uuid; v_exp uuid; v_take uuid; v_chg uuid; v_next uuid;
begin
  perform public.sht_append(2, 1, 1, null, null, 'a initial ball by scorer 2');
  v_h1 := public.sht_offer(2, 1, 3, null, 'a offer by scorer 2');
  perform public.sht_act(3, 'accept_scorer_handover', v_h1, null, 'a accept by target 3');
  perform public.sht_fail((select array_agg(user_id) from public.match_scorers where match_id = public.sht_m(1)) = array[public.sht_u(3)]
    and public.can_score_match(public.sht_m(1)), 'a target is sole scorer');
  perform public.sht_fail(exists (select 1 from public.scorer_handover where id = v_h1 and status = 'accepted' and resolved_at is not null), 'a accepted');
  perform public.sht_append(3, 2, 1, 1, null, 'a new scorer appends');
  perform public.sht_append(2, 3, 1, 2, '42501', 'a old scorer append refused');
  perform public.sht_fail(not public.can_score_match(public.sht_m(1)), 'a old scorer can_score_match false');
  perform public.sht_offer(4, 1, 4, '42501', 'b unrelated user offer');
  perform public.sht_offer(null, 1, 2, '42501', 'b signed-out offer');
  perform public.sht_offer(3, 1, 3, '42501', 'b offer to self');
  perform public.sht_offer(3, 1, 5, '42501', 'b offer to user without profile');
  perform public.sht_offer(1, 1, 1, 'ESH04', 'b creator offer while scorer active');
  v_dec := public.sht_offer(3, 1, 2, null, 'c offer for decline');
  perform public.sht_offer(3, 1, 1, 'ESH02', 'd second pending offer');
  perform public.sht_act(4, 'decline_scorer_handover', v_dec, '42501', 'c unrelated decline');
  perform public.sht_act(2, 'decline_scorer_handover', v_dec, null, 'c decline');
  perform public.sht_act(2, 'decline_scorer_handover', v_dec, null, 'h repeat decline');
  perform public.sht_act(2, 'accept_scorer_handover', v_dec, 'ESH01', 'c/h accept declined');
  perform public.sht_act(3, 'cancel_scorer_handover', v_dec, 'ESH01', 'h cancel declined');
  v_can1 := public.sht_offer(3, 1, 2, null, 'c offer for initiator cancel');
  perform public.sht_act(2, 'cancel_scorer_handover', v_can1, '42501', 'c target cannot cancel');
  perform public.sht_act(3, 'cancel_scorer_handover', v_can1, null, 'c initiator cancel');
  perform public.sht_act(3, 'cancel_scorer_handover', v_can1, null, 'h repeat cancel');
  perform public.sht_act(2, 'accept_scorer_handover', v_can1, 'ESH01', 'c accept cancelled 1');
  perform public.sht_act(2, 'decline_scorer_handover', v_can1, 'ESH01', 'h decline cancelled');
  v_can2 := public.sht_offer(3, 1, 2, null, 'c offer for creator cancel');
  perform public.sht_act(1, 'cancel_scorer_handover', v_can2, null, 'c creator cancel');
  perform public.sht_act(2, 'accept_scorer_handover', v_can2, 'ESH01', 'c accept cancelled 2');
  perform public.sht_age_balls(1, interval '16 minutes');
  v_can3 := public.sht_offer(1, 1, 2, null, 'c creator-initiated offer for from_user cancel');
  perform public.sht_act(3, 'cancel_scorer_handover', v_can3, null, 'c from_user cancel');
  perform public.sht_act(2, 'accept_scorer_handover', v_can3, 'ESH01', 'c accept cancelled 3');
  v_exp := public.sht_offer(3, 1, 2, null, 'c offer for expiry');
  perform public.sht_expire(v_exp);
  perform public.sht_act(2, 'accept_scorer_handover', v_exp, 'ESH01', 'c accept expired');
  v_take := public.sht_offer(1, 1, 1, null, 'e creator takeover offer');
  perform public.sht_append(3, 3, 1, 2, null, 'e ball between offer and accept');
  perform public.sht_act(1, 'accept_scorer_handover', v_take, 'ESH04', 'e active at accept');
  perform public.sht_age_balls(1, interval '16 minutes');
  perform public.sht_act(1, 'accept_scorer_handover', v_take, null, 'e creator takeover accept');
  perform public.sht_act(1, 'accept_scorer_handover', v_take, null, 'h repeat accept');
  perform public.sht_act(1, 'decline_scorer_handover', v_take, 'ESH01', 'h decline accepted');
  perform public.sht_act(1, 'cancel_scorer_handover', v_take, 'ESH01', 'h cancel accepted');
  perform public.sht_fail((select array_agg(user_id) from public.match_scorers where match_id = public.sht_m(1)) = array[public.sht_u(1)]
    and public.can_score_match(public.sht_m(1)), 'e creator took over');
  v_chg := public.sht_offer(1, 2, 3, null, 'f offer by initial creator scorer');
  insert into public.match_scorers (match_id, user_id) values (public.sht_m(2), public.sht_u(2));
  perform public.sht_act(3, 'accept_scorer_handover', v_chg, 'ESH03', 'f scorer changed');
  v_next := public.sht_offer(2, 2, 3, null, 'f new scorer offers');
  perform public.sht_as(1);
  perform public.sht_fail(exists (select 1 from public.scorer_handover where id = v_chg and status = 'cancelled' and resolved_at is not null), 'f cancelled');
  perform public.sht_as(2);
  perform public.save_match_result(public.sht_m(2), ('{"completed_at":"2026-11-01T12:00:00Z","team_a_runs":40,"team_a_wickets":1,"team_a_balls":12,'
    || '"team_b_runs":30,"team_b_wickets":2,"team_b_balls":12,"winner_side":"a","result_type":"runs","result_margin":10,"result_summary":"Alpha won"}')::jsonb,
    public.sht_e(9), null);
  perform public.sht_act(3, 'accept_scorer_handover', v_next, 'ESH05', 'g accept completed');
  perform public.sht_act(2, 'cancel_scorer_handover', v_next, null, 'g cancel pending on completed');
  perform public.sht_offer(2, 2, 3, 'ESH05', 'g offer completed');
  perform public.sht_offer(1, 3, 2, '42501', 'g non-friendly refused');
  perform public.sht_expect(format('insert into public.scorer_handover (match_id, from_user, to_user, initiated_by, expires_at) values (%L, %L, %L, %L, now())',
    public.sht_m(1), public.sht_u(1), public.sht_u(2), public.sht_u(1)), '42501', 'i direct insert');
  perform public.sht_expect(format('update public.scorer_handover set status = ''cancelled'' where id = %L', v_take), '42501', 'i direct update');
  perform public.sht_expect(format('delete from public.scorer_handover where id = %L', v_take), '42501', 'i direct delete');
  perform public.sht_expect(format('insert into public.match_scorers (match_id, user_id) values (%L, %L)', public.sht_m(1), public.sht_u(2)), 'P0001', 'j trigger');
  perform public.sht_as(4);
  perform public.sht_fail(not exists (select 1 from public.scorer_handover), 'i unrelated user sees no handovers');
end $$;
reset role;
rollback;
do $$
begin
  if exists (select 1 from auth.users where email like 'scorer-handover-test-%')
    or exists (select 1 from public.matches where id::text like 'f3e10000-0000-4000-8000-%')
    or to_regprocedure('public.sht_expect(text, text, text)') is not null then
    raise exception 'FAIL cleanup: fixture rows or helpers persisted';
  end if;
end $$;
select 'scorer_handover verification passed' as result;
