-- Deleting an unfinished friendly, and telling a chosen scorer.
--
-- * `delete_friendly_match(match)`: the creator removes a scheduled or live friendly with its squads, scorer,
--   balls and any handover. A finished match keeps its record (career figures read it), so it is refused.
--   Direct deletes on `matches` stay revoked; this function is the only way. A repeat for a match that is
--   already gone returns OK, so a lost reply is safe. It takes the create lock and then the scoring lock,
--   so it cannot interleave with a late save or a ball write. No other function takes them in the reverse order.
-- * A scorer assigned by someone else gets a `system` notification. It is written by a trigger on
--   `match_scorers`, so every path that assigns one (the friendly create RPC, a later handover) is covered
--   without changing those functions. Nobody is told about their own assignment (a handover accept).
-- * Error codes: 42501 not signed in or not allowed, ED001 the match is finished or not a friendly.

create or replace function public.notify_scorer_assigned() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_match public.matches;
  v_by text;
begin
  if (select auth.uid()) is null or new.user_id is not distinct from (select auth.uid()) then
    return new;
  end if;
  select * into v_match from public.matches where id = new.match_id;
  if not found or coalesce(v_match.fixture_ref, '') not like 'friendly-%' then
    return new;
  end if;
  select coalesce(nullif(full_name, ''), 'Someone') into v_by from public.profiles where id = (select auth.uid());
  insert into public.notifications (user_id, kind, title, message, data)
  values (new.user_id, 'system', 'You are the scorer',
    coalesce(v_by, 'Someone') || ' chose you to score ' || v_match.team_a_name || ' vs ' || v_match.team_b_name || '.',
    jsonb_build_object('type', 'scorer_assigned', 'match_id', new.match_id));
  return new;
end;
$$;
revoke all on function public.notify_scorer_assigned() from public, anon, authenticated;

drop trigger if exists match_scorer_assigned_notice on public.match_scorers;
create trigger match_scorer_assigned_notice after insert on public.match_scorers
  for each row execute function public.notify_scorer_assigned();

create or replace function public.delete_friendly_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
begin
  if v_uid is null or p_match is null then
    raise exception 'Sign in to delete a match' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('create_friendly_match:' || p_match::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || p_match::text, 0));
  select * into v_match from public.matches where id = p_match for update;
  if not found then
    return;
  end if;
  if v_match.created_by is distinct from v_uid then
    raise exception 'Only the person who created this match can delete it' using errcode = '42501';
  end if;
  if coalesce(v_match.fixture_ref, '') not like 'friendly-%' then
    raise exception 'Only a friendly match can be deleted here' using errcode = 'ED001';
  end if;
  if v_match.status not in ('scheduled', 'live') then
    raise exception 'A finished match cannot be deleted' using errcode = 'ED001';
  end if;
  delete from public.notifications
  where kind = 'system' and data ->> 'type' = 'scorer_assigned' and data ->> 'match_id' = p_match::text;
  delete from public.matches where id = p_match;
end;
$$;
revoke execute on function public.delete_friendly_match(uuid) from public, anon;
grant execute on function public.delete_friendly_match(uuid) to authenticated;
