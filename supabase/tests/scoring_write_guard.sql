-- Verification for the scoring write guard (migrations 20261101000000 and 20261101010000, score head).
--
-- Run as an administrator (SQL editor) after the migrations are applied. Everything, including the sgt_ test
-- helpers, runs inside one rolled-back transaction; the last block proves nothing was left behind. A failed
-- assertion raises an exception that starts with FAIL. The script ends with a select that names the result.
--
-- Two-session check by hand (not automatable in one session):
--   Both sessions: begin; set local role authenticated;
--     select set_config('request.jwt.claims', '{"sub":"<scorer id>","role":"authenticated"}', true);
--   Session A: select public.append_ball_event('<event json, new id X>', '<current score_head or null>');  -- open
--   Session B: the same call with another new id Y and the same head. It must wait on the advisory lock.
--   Session A: commit. Session B fails with ESC01. Session B: rollback. Only X follows the old head.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'scoring-guard-test-' || u.n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Guard test ' || u.n), now(), now()
from (values (1, 'f3f00000-0000-4000-8000-000000000001'::uuid), (2, 'f3f00000-0000-4000-8000-000000000002'::uuid),
  (3, 'f3f00000-0000-4000-8000-000000000003'::uuid)) u(n, id);
insert into public.profiles (id, full_name)
select id, 'Guard test' from auth.users where email like 'scoring-guard-test-%' on conflict (id) do nothing;

-- Helpers (rolled back). Ids are small numbers: match 1 (f3f10000), event 4 (f3f20000), operation 7 (f3f30000).
create function public.sgt_id(p_prefix text, p_n int) returns uuid language sql immutable as $$
  select case when p_n is null then null else (p_prefix || '-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid end;
$$;
create function public.sgt_m(p_n int) returns uuid language sql immutable as $$ select public.sgt_id('f3f10000', p_n) $$;
create function public.sgt_e(p_n int) returns uuid language sql immutable as $$ select public.sgt_id('f3f20000', p_n) $$;
create function public.sgt_o(p_n int) returns uuid language sql immutable as $$ select public.sgt_id('f3f30000', p_n) $$;
create function public.sgt_expect(p_sql text, p_code text, p_label text) returns void language plpgsql as $$
declare v_code text;
begin
  begin
    execute p_sql;
  exception when others then v_code := sqlstate;
  end;
  if v_code is distinct from p_code then
    raise exception 'FAIL %: expected %, got %', p_label, coalesce(p_code, 'success'), coalesce(v_code, 'success');
  end if;
end;
$$;
-- p_head is an event number when positive and an operation number when negative.
create function public.sgt_h(p_head int) returns uuid language sql immutable as $$
  select case when p_head < 0 then public.sgt_o(-p_head) else public.sgt_e(p_head) end;
$$;
create function public.sgt_append(p_ev int, p_match int, p_head int, p_code text, p_label text,
  p_extra jsonb default '{}') returns void language sql as $$
  select public.sgt_expect(format('select public.append_ball_event(%L::jsonb, %L::uuid)',
    jsonb_build_object('id', public.sgt_e(p_ev), 'match_id', public.sgt_m(p_match), 'innings', 1, 'kind', 'swap_ends')
      || p_extra, public.sgt_h(p_head)), p_code, p_label);
$$;
create function public.sgt_void(p_match int, p_ev int, p_op int, p_head int, p_code text, p_label text) returns void
language sql as $$
  select public.sgt_expect(format('select public.void_ball_events_from(%L::uuid, %L::uuid, %L::uuid, %L::uuid)',
    public.sgt_m(p_match), public.sgt_e(p_ev), public.sgt_o(p_op), public.sgt_h(p_head)), p_code, p_label);
$$;
create function public.sgt_result(p_match int, p_op int, p_head int, p_summary text, p_code text, p_label text)
returns void language sql as $$
  select public.sgt_expect(format('select public.save_match_result(%L::uuid, %L::jsonb, %L::uuid, %L::uuid)',
    public.sgt_m(p_match), jsonb_build_object('status', 'live', 'completed_at', '2026-11-01T10:00:00Z',
      'team_a_runs', 50, 'team_a_wickets', 2, 'team_a_balls', 36, 'team_b_runs', 45, 'team_b_wickets', 6,
      'team_b_balls', 36, 'winner_side', 'a', 'result_type', 'runs', 'result_margin', 5, 'result_summary', p_summary),
    public.sgt_o(p_op), public.sgt_h(p_head)), p_code, p_label);
$$;
create function public.sgt_reopen(p_match int, p_op int, p_head int, p_code text, p_label text) returns void
language sql as $$
  select public.sgt_expect(format('select public.reopen_match(%L::uuid, %L::uuid, %L::uuid)',
    public.sgt_m(p_match), public.sgt_o(p_op), public.sgt_h(p_head)), p_code, p_label);
$$;
-- Live event numbers of a match in seq order, for example '1,2,3'.
create function public.sgt_live(p_match int) returns text language sql as $$
  select coalesce(string_agg(ltrim(right(e.id::text, 12), '0'), ',' order by e.seq), '') from public.ball_events e
  where e.match_id = public.sgt_m(p_match) and e.voided_at is null;
$$;
create function public.sgt_fail(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not p_ok then raise exception 'FAIL %', p_label; end if;
end;
$$;
grant execute on function public.sgt_id(text, int), public.sgt_m(int), public.sgt_e(int), public.sgt_o(int),
  public.sgt_h(int), public.sgt_expect(text, text, text), public.sgt_append(int, int, int, text, text, jsonb),
  public.sgt_void(int, int, int, int, text, text), public.sgt_result(int, int, int, text, text, text),
  public.sgt_reopen(int, int, int, text, text), public.sgt_live(int), public.sgt_fail(boolean, text) to authenticated;

do $$
declare f text;
begin
  foreach f in array array['public.append_ball_event(jsonb, uuid)', 'public.void_ball_events_from(uuid, uuid, uuid, uuid)',
    'public.save_match_result(uuid, jsonb, uuid, uuid)', 'public.reopen_match(uuid, uuid, uuid)'] loop
    perform public.sgt_fail(not has_function_privilege('anon', f, 'execute')
      and has_function_privilege('authenticated', f, 'execute'), 'grants on ' || f);
  end loop;
  perform public.sgt_fail(to_regprocedure('public.check_scoring_tail(uuid, uuid)') is null, 'old tail helper remains');
  perform public.sgt_fail(not has_function_privilege('authenticated', 'public.claim_score_head(uuid, uuid, uuid)', 'execute')
    and not has_function_privilege('authenticated', 'public.begin_scoring_write(uuid)', 'execute'), 'internal helpers callable');
  perform public.sgt_fail(not has_column_privilege('authenticated', 'public.matches', 'score_head', 'update'),
    'score_head is directly writable');
end $$;

-- The creator (user 1) makes friendlies 1 and 2 with user 2 as the assigned scorer, and 3 with no scorer.
select set_config('t.match', '{"fixture_ref":"friendly-guard-test","team_a_name":"Alpha","team_a_short":"ALP",'
  || '"team_a_tone":"blue","team_b_name":"Beta","team_b_short":"BET","team_b_tone":"yellow","overs_limit":6}', true);
select set_config('t.players', '[{"key":"p1","side":"a","name":"Creator","sort_order":0,'
  || '"profile_id":"f3f00000-0000-4000-8000-000000000001"},{"key":"p2","side":"b","name":"Scorer","sort_order":0,'
  || '"profile_id":"f3f00000-0000-4000-8000-000000000002"},{"key":"p3","side":"b","name":"Guest B","sort_order":1},'
  || '{"key":"p4","side":"a","name":"Guest A","sort_order":1}]', true);
select set_config('request.jwt.claims', '{"sub":"f3f00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare n int;
begin
  for n in 1..3 loop
    perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(public.sgt_m(n)::text)),
      current_setting('t.players')::jsonb, case when n < 3 then public.sgt_id('f3f00000', 2) end);
  end loop;
end $$;

select set_config('request.jwt.claims', '{"sub":"f3f00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$
declare v_ev public.ball_events;
begin
  -- a) Appends in order with the right head succeed. b) A stale head gets ESC01 and writes nothing.
  perform public.sgt_append(1, 1, null, null, 'a first');
  perform public.sgt_append(2, 1, 1, null, 'a second');
  perform public.sgt_append(3, 1, 2, null, 'a third');
  perform public.sgt_append(4, 1, null, 'ESC01', 'b null head');
  perform public.sgt_append(4, 1, 2, 'ESC01', 'b old head');
  perform public.sgt_fail(public.sgt_live(1) = '1,2,3', 'a/b live events ' || public.sgt_live(1));

  -- c) Repeating the last accepted write succeeds with any head. c2) Repeating an older one is a conflict.
  perform public.sgt_append(3, 1, null, null, 'c repeat of the head');
  perform public.sgt_append(2, 1, 3, 'ESC01', 'c2 repeat behind the head');
  perform public.sgt_fail((select count(*) from public.ball_events where match_id = public.sgt_m(1)) = 3, 'c rows added');

  -- d) The same id under another match raises. h) Empty optional player keys are stored as null.
  perform public.sgt_append(2, 2, null, '23505', 'd other match');
  perform public.sgt_append(4, 1, 3, null, 'h empty keys', ('{"kind":"delivery","delivery_kind":"runs","striker_key":"p1",'
    || '"non_striker_key":"p4","bowler_key":"p3","runs":1,"total_runs":1,"is_legal":true,"out_key":"",'
    || '"next_batter_key":"","fielder_key":""}')::jsonb);
  select * into v_ev from public.ball_events where id = public.sgt_e(4);
  perform public.sgt_fail(v_ev.out_key is null and v_ev.next_batter_key is null and v_ev.fielder_key is null, 'h keys');

  -- i) Client seq and voided_at are ignored; an unscorable match, no match_id or no operation id are rejected.
  perform public.sgt_append(5, 1, 4, null, 'i server columns', '{"seq":999999,"voided_at":"2000-01-01T00:00:00Z"}');
  select * into v_ev from public.ball_events where id = public.sgt_e(5);
  perform public.sgt_fail(v_ev.seq <> 999999 and v_ev.voided_at is null, 'i client columns stored');
  perform public.sgt_append(6, 3, null, '42501', 'i unscorable match');
  perform public.sgt_expect(format('select public.append_ball_event(%L::jsonb, null)',
    jsonb_build_object('id', public.sgt_e(6), 'innings', 1, 'kind', 'swap_ends')), '22023', 'i no match_id');
  perform public.sgt_expect(format('select public.reopen_match(%L::uuid, null, %L::uuid)', public.sgt_m(1), public.sgt_e(5)),
    '22023', 'i no operation id');

  -- e) Void from 4 voids 4 and 5; a repeat succeeds; a stale head gets ESC01; a void of a missing event P0002.
  perform public.sgt_void(1, 4, 1, 5, null, 'e void');
  perform public.sgt_void(1, 4, 1, 3, null, 'e repeat');
  perform public.sgt_void(1, 2, 2, 5, 'ESC01', 'e stale');
  perform public.sgt_void(1, 99, 2, -1, 'P0002', 'e missing event');
  perform public.sgt_fail(public.sgt_live(1) = '1,2,3', 'e live after void ' || public.sgt_live(1));

  -- e2) Void then append from another device: the replay of voided event 4 and of event 5 are conflicts.
  perform public.sgt_append(4, 1, 3, 'ESC01', 'e2 replay of a voided event');
  -- e3) Append then void: device A appends 6 after the void; device B's replay of that void is a conflict.
  perform public.sgt_append(6, 1, -1, null, 'e3 append after void');
  perform public.sgt_void(1, 4, 1, 5, 'ESC01', 'e3 replay of an older void');
  perform public.sgt_fail(public.sgt_live(1) = '1,2,3,6', 'e3 live ' || public.sgt_live(1));

  -- f) Result: right head OK, repeat OK, a competing result with the same head ESC01.
  perform public.sgt_result(1, 3, 6, 'Alpha won by 5 runs', null, 'f result');
  perform public.sgt_result(1, 3, 6, 'Alpha won by 5 runs', null, 'f result repeat');
  perform public.sgt_result(1, 4, 6, 'Competing', 'ESC01', 'f competing result');
  perform public.sgt_fail(exists (select 1 from public.matches where id = public.sgt_m(1) and status = 'completed'
    and result_summary = 'Alpha won by 5 runs'), 'f stored result');
  -- f2) Lost reply, then another device reopens: the retried result is a conflict, not a silent re-complete.
  perform public.sgt_reopen(1, 5, -3, null, 'f2 reopen');
  perform public.sgt_reopen(1, 5, 6, null, 'f2 reopen repeat');
  perform public.sgt_result(1, 3, 6, 'Alpha won by 5 runs', 'ESC01', 'f2 result retry after reopen');
  perform public.sgt_fail(exists (select 1 from public.matches where id = public.sgt_m(1) and status = 'live'
    and result_type is null and team_a_runs is null and score_head = public.sgt_o(5)), 'f2 reopened state');
end $$;

-- g) The friendly's creator, an unrelated user and a signed-out caller get 42501 from every function.
do $$
declare v_claims text;
begin
  foreach v_claims in array array['{"sub":"f3f00000-0000-4000-8000-000000000001","role":"authenticated"}',
    '{"sub":"f3f00000-0000-4000-8000-000000000003","role":"authenticated"}', '{"role":"authenticated"}'] loop
    perform set_config('request.jwt.claims', v_claims, true);
    perform public.sgt_append(7, 1, -5, '42501', 'g append ' || v_claims);
    perform public.sgt_void(1, 6, 6, -5, '42501', 'g void ' || v_claims);
    perform public.sgt_result(1, 7, -5, 'Intruder', '42501', 'g result ' || v_claims);
    perform public.sgt_reopen(1, 8, -5, '42501', 'g reopen ' || v_claims);
  end loop;
  perform public.sgt_fail(public.sgt_live(1) = '1,2,3,6' and exists (select 1 from public.matches
    where id = public.sgt_m(1) and status = 'live' and score_head = public.sgt_o(5)), 'g a refused caller changed the match');
end $$;

reset role;
rollback;

do $$
begin
  if exists (select 1 from auth.users where email like 'scoring-guard-test-%')
    or exists (select 1 from public.matches where id::text like 'f3f10000-0000-4000-8000-%')
    or to_regprocedure('public.sgt_expect(text, text, text)') is not null then
    raise exception 'FAIL cleanup: fixture rows or helpers persisted';
  end if;
end $$;
select 'scoring_write_guard verification passed' as result;
