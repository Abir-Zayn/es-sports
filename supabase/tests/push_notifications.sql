-- Verification for push notifications. Run as an administrator; everything rolls back.
-- A queued notification is claimed once with its device token; a bad token is refused; only the server may claim.
begin;
do $$
declare v_user uuid; got text; again int;
begin
  select id into v_user from public.profiles limit 1;
  insert into public.push_tokens (user_id, token, platform) values (v_user, 'ExponentPushToken[claim-test]', 'android');
  insert into public.notifications (user_id, kind, title, message, data) values (v_user, 'system', 'T', 'M', '{"url":"/notifications"}');
  select string_agg(token || ':' || title, ',') into got from public.claim_push_batch(10) where token = 'ExponentPushToken[claim-test]';
  if got is distinct from 'ExponentPushToken[claim-test]:T' then raise exception 'FAIL claim: %', got; end if;
  select count(*) into again from public.claim_push_batch(10) where token = 'ExponentPushToken[claim-test]';
  if again <> 0 then raise exception 'FAIL: claimed twice'; end if;
  begin
    insert into public.push_tokens (user_id, token, platform) values (v_user, 'not-a-token', 'android');
    raise exception 'FAIL: bad token accepted';
  exception when check_violation then null;
  end;
  if has_function_privilege('authenticated', 'public.claim_push_batch(int)', 'execute') then raise exception 'FAIL: claim open to users'; end if;
  if not has_function_privilege('authenticated', 'public.register_push_token(text, text)', 'execute') then raise exception 'FAIL: register grant'; end if;
end $$;
rollback;
