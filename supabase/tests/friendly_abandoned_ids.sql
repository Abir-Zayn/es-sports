-- Verification for public.abandon_friendly_matches and the abandoned-id trigger (migration 20261031140000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Everything runs inside one rolled-back
-- transaction; the last block proves nothing was left behind. A failed assertion raises an exception that
-- starts with FAIL. The SQL editor may not show notices, so the script ends with a select that names the result.
--
-- Race check by hand (not automatable in one session):
--   Session A: begin; set local role authenticated; set the jwt claims to your user id;
--     select public.abandon_friendly_matches(array['<id X>'::uuid]);   -- leave open
--   Session B: same claims; select public.create_friendly_match('<match json with id X>', '<players json>');
--     It must wait on the advisory lock. Commit A: B fails with EFA01 and no match X exists.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'friendly-abandon-test-' || u.n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Abandon test ' || u.n), now(), now()
from (values (1, 'f3c00000-0000-4000-8000-000000000001'::uuid), (2, 'f3c00000-0000-4000-8000-000000000002'::uuid)) u(n, id);
insert into public.profiles (id, full_name)
select id, 'Abandon test' from auth.users where email like 'friendly-abandon-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.abandon_friendly_matches(uuid[])', 'execute')
    or not has_function_privilege('authenticated', 'public.abandon_friendly_matches(uuid[])', 'execute') then
    raise exception 'FAIL grants: only authenticated may execute abandon_friendly_matches';
  end if;
end $$;

select set_config('t.match', '{"fixture_ref":"friendly-abandon-test","team_a_name":"Alpha","team_a_short":"ALP",'
  || '"team_a_tone":"blue","team_b_name":"Beta","team_b_short":"BET","team_b_tone":"yellow","overs_limit":6}', true);
select set_config('t.players', '[{"key":"p1","side":"a","name":"Creator","sort_order":0},'
  || '{"key":"p2","side":"b","name":"Guest","sort_order":0}]', true);
select set_config('request.jwt.claims', '{"sub":"f3c00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

-- k) An id with no match is abandoned and returned; saving it afterwards fails with EFA01 and writes nothing.
-- l) An id with a match is not returned and gets no row. m) Abandoning again returns the id again.
do $$
declare
  gone uuid := 'f3d00000-0000-4000-8000-000000000001';
  kept uuid := 'f3d00000-0000-4000-8000-000000000002';
  r uuid[];
  code text;
begin
  perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(kept::text)),
    current_setting('t.players')::jsonb);
  r := public.abandon_friendly_matches(array[kept, gone, gone, null]);
  if r is distinct from array[gone] then raise exception 'FAIL k/l: returned %', r; end if;
  if exists (select 1 from public.friendly_abandoned_ids where match_id = kept) then
    raise exception 'FAIL l: a saved match was marked abandoned';
  end if;
  begin
    perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(gone::text)),
      current_setting('t.players')::jsonb);
  exception when others then code := sqlstate;
  end;
  if code is distinct from 'EFA01' then raise exception 'FAIL k: saving an abandoned id gave %', code; end if;
  if exists (select 1 from public.matches where id = gone) or exists (select 1 from public.match_players where match_id = gone) then
    raise exception 'FAIL k: rows were written for an abandoned id';
  end if;
  if public.abandon_friendly_matches(array[gone]) is distinct from array[gone] then
    raise exception 'FAIL m: a repeat abandon did not return the id';
  end if;
end $$;

-- n) Another account neither sees the row nor gets the id back, and cannot save a match with it.
select set_config('request.jwt.claims', '{"sub":"f3c00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$
declare
  gone uuid := 'f3d00000-0000-4000-8000-000000000001';
  code text;
begin
  if exists (select 1 from public.friendly_abandoned_ids) then raise exception 'FAIL n: another account saw the row'; end if;
  if public.abandon_friendly_matches(array[gone]) <> '{}' then raise exception 'FAIL n: another account got the id'; end if;
  begin
    perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(gone::text)),
      current_setting('t.players')::jsonb);
  exception when others then code := sqlstate;
  end;
  if code is distinct from 'EFA01' then raise exception 'FAIL n: another account saved an abandoned id (%)', code; end if;
end $$;

-- o) More than 100 ids at once are rejected.
do $$
declare rejected boolean := false;
begin
  begin
    perform public.abandon_friendly_matches(array(select gen_random_uuid() from generate_series(1, 101)));
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL o: 101 ids were accepted'; end if;
end $$;

reset role;
rollback;

do $$
begin
  if exists (select 1 from auth.users where email like 'friendly-abandon-test-%')
    or exists (select 1 from public.friendly_abandoned_ids where match_id::text like 'f3d00000-0000-4000-8000-%')
    or exists (select 1 from public.matches where id::text like 'f3d00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
end $$;
select 'friendly_abandoned_ids verification passed' as result;
