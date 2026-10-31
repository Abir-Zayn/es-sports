-- Verification for the scoring write guard (migration 20261101000000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Everything, including the sgt_ test
-- helpers, runs inside one rolled-back transaction; the last block proves nothing was left behind. A failed
-- assertion raises an exception that starts with FAIL. The script ends with a select that names the result.
--
-- Two-session check by hand (not automatable in one session):
--   Both sessions: begin; set local role authenticated;
--     select set_config('request.jwt.claims', '{"sub":"<scorer id>","role":"authenticated"}', true);
--   Session A: select public.append_ball_event('<event json, new id X>', '<current tail or null>');  -- leave open
--   Session B: the same call with another new id Y and the same tail. It must wait on the advisory lock.
--   Session A: commit. Session B fails with ESC01 "This match was changed on another device".
--   Session B: rollback. Only X follows the old tail.

begin;

-- Fixture accounts: creator, assigned scorer, an unrelated user.
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'scoring-guard-test-' || u.n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Guard test ' || u.n), now(), now()
from (values (1, 'f3f00000-0000-4000-8000-000000000001'::uuid), (2, 'f3f00000-0000-4000-8000-000000000002'::uuid),
  (3, 'f3f00000-0000-4000-8000-000000000003'::uuid)) u(n, id);
insert into public.profiles (id, full_name)
select id, 'Guard test' from auth.users where email like 'scoring-guard-test-%' on conflict (id) do nothing;

-- Helpers (rolled back with everything else). Ids are written as small numbers: match 1, event 4, user 2.
create function public.sgt_id(p_prefix text, p_n int) returns uuid language sql immutable as $$
  select case when p_n is null then null else (p_prefix || '-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid end;
$$;
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
create function public.sgt_append(p_ev int, p_match int, p_tail int, p_code text, p_label text,
  p_extra jsonb default '{}') returns void language sql as $$
  select public.sgt_expect(format('select public.append_ball_event(%L::jsonb, %L::uuid)',
    jsonb_build_object('id', public.sgt_id('f3f20000', p_ev), 'match_id', public.sgt_id('f3f10000', p_match),
      'innings', 1, 'kind', 'swap_ends') || p_extra, public.sgt_id('f3f20000', p_tail)), p_code, p_label);
$$;
create function public.sgt_void(p_match int, p_ev int, p_tail int, p_code text, p_label text) returns void
language sql as $$
  select public.sgt_expect(format('select public.void_ball_events_from(%L::uuid, %L::uuid, %L::uuid)',
    public.sgt_id('f3f10000', p_match), public.sgt_id('f3f20000', p_ev), public.sgt_id('f3f20000', p_tail)),
    p_code, p_label);
$$;
create function public.sgt_result(p_match int, p_tail int, p_summary text, p_code text, p_label text) returns void
language sql as $$
  select public.sgt_expect(format('select public.save_match_result(%L::uuid, %L::jsonb, %L::uuid)',
    public.sgt_id('f3f10000', p_match), jsonb_build_object('status', 'live', 'completed_at', '2026-11-01T10:00:00Z',
      'team_a_runs', 50, 'team_a_wickets', 2, 'team_a_balls', 36, 'team_b_runs', 45, 'team_b_wickets', 6,
      'team_b_balls', 36, 'winner_side', 'a', 'result_type', 'runs', 'result_margin', 5, 'result_summary', p_summary),
    public.sgt_id('f3f20000', p_tail)), p_code, p_label);
$$;
create function public.sgt_reopen(p_match int, p_tail int, p_code text, p_label text) returns void language sql as $$
  select public.sgt_expect(format('select public.reopen_match(%L::uuid, %L::uuid)',
    public.sgt_id('f3f10000', p_match), public.sgt_id('f3f20000', p_tail)), p_code, p_label);
$$;
-- Live event numbers of a match in seq order, for example '1,2,3'.
create function public.sgt_live(p_match int) returns text language sql as $$
  select coalesce(string_agg(ltrim(right(e.id::text, 12), '0'), ',' order by e.seq), '') from public.ball_events e
  where e.match_id = public.sgt_id('f3f10000', p_match) and e.voided_at is null;
$$;
grant execute on function public.sgt_id(text, int), public.sgt_expect(text, text, text),
  public.sgt_append(int, int, int, text, text, jsonb), public.sgt_void(int, int, int, text, text),
  public.sgt_result(int, int, text, text, text), public.sgt_reopen(int, int, text, text), public.sgt_live(int)
  to authenticated;

do $$
declare f text;
begin
  foreach f in array array['public.append_ball_event(jsonb, uuid)', 'public.void_ball_events_from(uuid, uuid, uuid)',
    'public.save_match_result(uuid, jsonb, uuid)', 'public.reopen_match(uuid, uuid)'] loop
    if has_function_privilege('anon', f, 'execute') or not has_function_privilege('authenticated', f, 'execute') then
      raise exception 'FAIL grants: only authenticated may execute %', f;
    end if;
  end loop;
  if has_function_privilege('authenticated', 'public.begin_scoring_write(uuid)', 'execute')
    or has_function_privilege('authenticated', 'public.check_scoring_tail(uuid, uuid)', 'execute') then
    raise exception 'FAIL grants: the internal helpers must not be callable by authenticated';
  end if;
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
    perform public.create_friendly_match(
      jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(public.sgt_id('f3f10000', n)::text)),
      current_setting('t.players')::jsonb, case when n < 3 then public.sgt_id('f3f00000', 2) end);
  end loop;
end $$;

select set_config('request.jwt.claims', '{"sub":"f3f00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$
declare
  v_msg text;
  v_ev public.ball_events;
begin
  -- a) Appends in order with the right tail succeed.
  perform public.sgt_append(1, 1, null, null, 'a first');
  perform public.sgt_append(2, 1, 1, null, 'a second');
  perform public.sgt_append(3, 1, 2, null, 'a third');
  if public.sgt_live(1) <> '1,2,3' then raise exception 'FAIL a: live events %', public.sgt_live(1); end if;

  -- b) A second device that still expects no events (or an old tail) gets ESC01 and writes nothing.
  perform public.sgt_append(4, 1, null, 'ESC01', 'b null tail');
  perform public.sgt_append(4, 1, 2, 'ESC01', 'b old tail');
  begin
    perform public.append_ball_event(jsonb_build_object('id', public.sgt_id('f3f20000', 4),
      'match_id', public.sgt_id('f3f10000', 1), 'innings', 1, 'kind', 'swap_ends'), null);
  exception when sqlstate 'ESC01' then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'This match was changed on another device' then raise exception 'FAIL b: message %', v_msg; end if;
  if public.sgt_live(1) <> '1,2,3' then raise exception 'FAIL b: a stale append wrote %', public.sgt_live(1); end if;

  -- c) Repeating a stored id (a lost reply) succeeds even with a stale tail and adds no row.
  perform public.sgt_append(2, 1, null, null, 'c repeat');
  if (select count(*) from public.ball_events where match_id = public.sgt_id('f3f10000', 1)) <> 3 then
    raise exception 'FAIL c: a repeat added a row';
  end if;

  -- d) The same id under another match raises and writes nothing there.
  perform public.sgt_append(2, 2, null, '23505', 'd other match');
  if public.sgt_live(2) <> '' then raise exception 'FAIL d: match 2 has events'; end if;

  -- h) Empty optional player keys are stored as null (issue #6).
  perform public.sgt_append(4, 1, 3, null, 'h empty keys', '{"kind":"delivery","delivery_kind":"runs","striker_key":"p1",'
    || '"non_striker_key":"p4","bowler_key":"p3","runs":1,"total_runs":1,"is_legal":true,"out_key":"",'
    || '"next_batter_key":"","fielder_key":""}');
  select * into v_ev from public.ball_events where id = public.sgt_id('f3f20000', 4);
  if v_ev.out_key is not null or v_ev.next_batter_key is not null or v_ev.fielder_key is not null then
    raise exception 'FAIL h: empty keys were stored';
  end if;

  -- i) Client seq, voided_at and created_at are ignored; a match the caller cannot score, or none, is rejected.
  perform public.sgt_append(5, 1, 4, null, 'i server columns',
    '{"seq":999999,"voided_at":"2000-01-01T00:00:00Z","created_at":"2000-01-01T00:00:00Z"}');
  select * into v_ev from public.ball_events where id = public.sgt_id('f3f20000', 5);
  if v_ev.seq = 999999 or v_ev.voided_at is not null or v_ev.created_at < '2001-01-01' then
    raise exception 'FAIL i: client-sent server columns were stored';
  end if;
  perform public.sgt_append(6, 3, null, '42501', 'i unscorable match');
  perform public.sgt_expect(format('select public.append_ball_event(%L::jsonb, null)', jsonb_build_object(
    'id', public.sgt_id('f3f20000', 6), 'innings', 1, 'kind', 'swap_ends')), '22023', 'i no match_id');
  if exists (select 1 from public.ball_events where id = public.sgt_id('f3f20000', 6)) then
    raise exception 'FAIL i: a rejected event was stored';
  end if;

  -- e) Void from 4 with the right tail voids 4 and 5; a repeat succeeds; a stale tail gets ESC01.
  perform public.sgt_void(1, 4, 5, null, 'e void');
  if public.sgt_live(1) <> '1,2,3' then raise exception 'FAIL e: live after void %', public.sgt_live(1); end if;
  perform public.sgt_void(1, 4, 5, null, 'e repeat');
  perform public.sgt_void(1, 2, 5, 'ESC01', 'e stale');
  if public.sgt_live(1) <> '1,2,3' then raise exception 'FAIL e: a stale void wrote %', public.sgt_live(1); end if;
  perform public.sgt_append(6, 1, 3, null, 'e append after void');

  -- f) Result and reopen: right tail OK (status forced to completed), stale tail ESC01, repeat OK.
  perform public.sgt_result(1, 6, 'Alpha won by 5 runs', null, 'f result');
  perform public.sgt_result(1, 6, 'Alpha won by 5 runs', null, 'f result repeat');
  perform public.sgt_result(1, 3, 'Stale', 'ESC01', 'f result stale');
  if not exists (select 1 from public.matches where id = public.sgt_id('f3f10000', 1) and status = 'completed'
    and result_type = 'runs' and result_summary = 'Alpha won by 5 runs') then
    raise exception 'FAIL f: the stored result is wrong';
  end if;
  perform public.sgt_reopen(1, 3, 'ESC01', 'f reopen stale');
  perform public.sgt_reopen(1, 6, null, 'f reopen');
  perform public.sgt_reopen(1, 3, null, 'f reopen repeat');
  if not exists (select 1 from public.matches where id = public.sgt_id('f3f10000', 1) and status = 'live'
    and result_type is null and result_summary is null and team_a_runs is null) then
    raise exception 'FAIL f: reopen did not clear the result';
  end if;
end $$;

-- g) The friendly's creator, an unrelated user and a signed-out caller get 42501 from every function.
do $$
declare v_claims text;
begin
  foreach v_claims in array array['{"sub":"f3f00000-0000-4000-8000-000000000001","role":"authenticated"}',
    '{"sub":"f3f00000-0000-4000-8000-000000000003","role":"authenticated"}', '{"role":"authenticated"}'] loop
    perform set_config('request.jwt.claims', v_claims, true);
    perform public.sgt_append(7, 1, 6, '42501', 'g append ' || v_claims);
    perform public.sgt_void(1, 6, 6, '42501', 'g void ' || v_claims);
    perform public.sgt_result(1, 6, 'Intruder', '42501', 'g result ' || v_claims);
    perform public.sgt_reopen(1, 6, '42501', 'g reopen ' || v_claims);
  end loop;
  if public.sgt_live(1) <> '1,2,3,6' or exists (select 1 from public.matches
    where id = public.sgt_id('f3f10000', 1) and status <> 'live') then
    raise exception 'FAIL g: a refused caller changed the match';
  end if;
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
