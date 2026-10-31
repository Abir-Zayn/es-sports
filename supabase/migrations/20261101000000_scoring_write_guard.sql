-- Scoring write guard: every scoring write names the tail the phone expects, and the server refuses a stale one.
--
-- * Until now the outbox wrote straight to `ball_events` and `matches`. Two writers on one match (a second
--   phone on the same account, or the old scorer during a handover) could interleave balls unnoticed.
-- * Each function below takes the expected tail: the id of the last live event (`voided_at is null`, highest
--   `seq`) the phone believes the server holds, or null for none. A different tail raises ESC01.
-- * Order inside each function: sign-in check, `can_score_match` (42501), the per-match advisory lock, the
--   idempotent-repeat check (a lost reply), the tail check, then the write. The lock is taken before the tail
--   is read, so two writers with the same tail cannot both succeed.
-- * Security definer with an explicit `can_score_match` check, so a later migration (step 4b) can revoke
--   direct table writes without rewriting these. Only listed columns are written; table checks and foreign
--   keys still apply. `void_events_from` and the existing grants stay for builds that are not yet updated.

-- Sign-in, permission and the per-match lock shared by every guarded write. Released when the transaction ends.
create function public.begin_scoring_write(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to score this match' using errcode = '42501';
  end if;
  if p_match is null or not public.can_score_match(p_match) then
    raise exception 'You are not allowed to score this match' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || p_match::text, 0));
end;
$$;
revoke all on function public.begin_scoring_write(uuid) from public, anon, authenticated;

-- Raises ESC01 when the server's last live event is not the one the phone expects.
create function public.check_scoring_tail(p_match uuid, p_expected_tail uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_tail uuid;
begin
  select e.id into v_tail from public.ball_events e
  where e.match_id = p_match and e.voided_at is null order by e.seq desc limit 1;
  if v_tail is distinct from p_expected_tail then
    raise exception 'This match was changed on another device' using errcode = 'ESC01';
  end if;
end;
$$;
revoke all on function public.check_scoring_tail(uuid, uuid) from public, anon, authenticated;

-- Appends one event. Only the `BallEventInsert` columns are read; seq, voided_at and created_at are the server's.
create function public.append_ball_event(p_row jsonb, p_expected_tail uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.ball_events;
  v_stored uuid;
begin
  if p_row is null or jsonb_typeof(p_row) <> 'object' or p_row ->> 'id' is null or p_row ->> 'match_id' is null then
    raise exception 'An event needs an id and a match_id' using errcode = '22023';
  end if;
  v_row := jsonb_populate_record(null::public.ball_events, (
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(p_row) e
    where e.key in ('id', 'match_id', 'innings', 'kind', 'striker_key', 'non_striker_key', 'bowler_key',
      'delivery_kind', 'runs', 'total_runs', 'is_legal', 'dismissal', 'out_key', 'next_batter_key',
      'fielder_key', 'angle')
  ));
  perform public.begin_scoring_write(v_row.match_id);

  -- A repeat after a lost reply: already stored, so the tail has moved past it. Not looked at again.
  select e.match_id into v_stored from public.ball_events e where e.id = v_row.id;
  if found then
    if v_stored = v_row.match_id then
      return;
    end if;
    raise exception 'This event id belongs to another match' using errcode = '23505';
  end if;

  perform public.check_scoring_tail(v_row.match_id, p_expected_tail);
  insert into public.ball_events (
    id, match_id, innings, kind, striker_key, non_striker_key, bowler_key, delivery_kind, runs, total_runs,
    is_legal, dismissal, out_key, next_batter_key, fielder_key, angle
  ) values (
    v_row.id, v_row.match_id, v_row.innings, v_row.kind, nullif(v_row.striker_key, ''),
    nullif(v_row.non_striker_key, ''), nullif(v_row.bowler_key, ''), v_row.delivery_kind, v_row.runs,
    v_row.total_runs, v_row.is_legal, v_row.dismissal, nullif(v_row.out_key, ''),
    nullif(v_row.next_batter_key, ''), nullif(v_row.fielder_key, ''), v_row.angle
  );
end;
$$;

-- Undo: voids the event and every later one in the match.
create function public.void_ball_events_from(p_match uuid, p_event uuid, p_expected_tail uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_seq bigint;
  v_voided timestamptz;
begin
  perform public.begin_scoring_write(p_match);
  select e.seq, e.voided_at into v_seq, v_voided from public.ball_events e
  where e.id = p_event and e.match_id = p_match;
  -- A repeat after a lost reply.
  if v_voided is not null then
    return;
  end if;
  perform public.check_scoring_tail(p_match, p_expected_tail);
  if v_seq is null then
    raise exception 'This event is not in this match' using errcode = 'P0002';
  end if;
  update public.ball_events set voided_at = now()
  where match_id = p_match and seq >= v_seq and voided_at is null;
end;
$$;

-- Final result. A result does not move the tail, so a repeat with the same tail passes the check again.
create function public.save_match_result(p_match uuid, p_result jsonb, p_expected_tail uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_row public.matches;
begin
  perform public.begin_scoring_write(p_match);
  if p_result is null or jsonb_typeof(p_result) <> 'object' then
    raise exception 'The result must be a JSON object' using errcode = '22023';
  end if;
  perform public.check_scoring_tail(p_match, p_expected_tail);
  v_row := jsonb_populate_record(null::public.matches, p_result);
  update public.matches set
    status = 'completed', completed_at = v_row.completed_at,
    team_a_runs = v_row.team_a_runs, team_a_wickets = v_row.team_a_wickets, team_a_balls = v_row.team_a_balls,
    team_b_runs = v_row.team_b_runs, team_b_wickets = v_row.team_b_wickets, team_b_balls = v_row.team_b_balls,
    winner_side = v_row.winner_side, result_type = v_row.result_type, result_margin = v_row.result_margin,
    result_summary = v_row.result_summary
  where id = p_match;
end;
$$;

-- Undoing the last ball of a finished match puts it back to live and clears the result.
create function public.reopen_match(p_match uuid, p_expected_tail uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.begin_scoring_write(p_match);
  -- A repeat after a lost reply.
  if exists (select 1 from public.matches m where m.id = p_match and m.status = 'live' and m.result_type is null) then
    return;
  end if;
  perform public.check_scoring_tail(p_match, p_expected_tail);
  update public.matches set
    status = 'live', completed_at = null, winner_side = null, result_type = null, result_margin = null,
    result_summary = null, team_a_runs = null, team_a_wickets = null, team_a_balls = null,
    team_b_runs = null, team_b_wickets = null, team_b_balls = null
  where id = p_match;
end;
$$;

revoke execute on function public.append_ball_event(jsonb, uuid) from public, anon;
revoke execute on function public.void_ball_events_from(uuid, uuid, uuid) from public, anon;
revoke execute on function public.save_match_result(uuid, jsonb, uuid) from public, anon;
revoke execute on function public.reopen_match(uuid, uuid) from public, anon;
grant execute on function public.append_ball_event(jsonb, uuid) to authenticated;
grant execute on function public.void_ball_events_from(uuid, uuid, uuid) to authenticated;
grant execute on function public.save_match_result(uuid, jsonb, uuid) to authenticated;
grant execute on function public.reopen_match(uuid, uuid) to authenticated;
