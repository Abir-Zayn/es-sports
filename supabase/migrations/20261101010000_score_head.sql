-- Score head: guard every scoring write with the id of the last write the match accepted.
--
-- * The first guard (20261101000000) compared the last live event. That cannot tell a lost-reply repeat from
--   another device's change once the event was voided, and a result or reopen does not move it at all.
-- * Now `matches.score_head` holds the operation id of the last guarded write: the event id for an append,
--   and a client-generated id for an undo, a result or a reopen. Each write names its own id and the head it
--   expects. Under the per-match lock:
--     head = this write's id      -> a repeat after a lost reply; OK, nothing is written again.
--     head = the expected head    -> the write is applied and the head becomes its id.
--     anything else               -> ESC01, nothing is written.
-- * Existing matches start with the last live event as their head. Builds that still write the tables
--   directly do not move the head; that path is closed in step 4b.
-- * The four functions replace the expected-tail versions, which no released build calls yet.

alter table public.matches add column score_head uuid;

update public.matches m set score_head = (
  select e.id from public.ball_events e where e.match_id = m.id and e.voided_at is null order by e.seq desc limit 1
);

drop function public.append_ball_event(jsonb, uuid);
drop function public.void_ball_events_from(uuid, uuid, uuid);
drop function public.save_match_result(uuid, jsonb, uuid);
drop function public.reopen_match(uuid, uuid);
drop function public.check_scoring_tail(uuid, uuid);

-- After `begin_scoring_write`: false for a repeat of the last accepted write, true when it may be applied,
-- ESC01 when another write came first.
create function public.claim_score_head(p_match uuid, p_op uuid, p_expected_head uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_head uuid;
begin
  if p_op is null then
    raise exception 'A scoring write needs an operation id' using errcode = '22023';
  end if;
  select m.score_head into v_head from public.matches m where m.id = p_match;
  if v_head = p_op then
    return false;
  end if;
  if v_head is distinct from p_expected_head then
    raise exception 'This match was changed on another device' using errcode = 'ESC01';
  end if;
  return true;
end;
$$;
revoke all on function public.claim_score_head(uuid, uuid, uuid) from public, anon, authenticated;

-- Appends one event; its id is the operation id. Only the `BallEventInsert` columns are read.
create function public.append_ball_event(p_row jsonb, p_expected_head uuid) returns void
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
  select e.match_id into v_stored from public.ball_events e where e.id = v_row.id;
  if found then
    if v_stored <> v_row.match_id then
      raise exception 'This event id belongs to another match' using errcode = '23505';
    end if;
    -- Stored already: a repeat of the head is OK; one that later writes went past is another device's change.
    if (select m.score_head from public.matches m where m.id = v_row.match_id) = v_row.id then
      return;
    end if;
    raise exception 'This match was changed on another device' using errcode = 'ESC01';
  end if;
  if not public.claim_score_head(v_row.match_id, v_row.id, p_expected_head) then
    return;
  end if;
  insert into public.ball_events (
    id, match_id, innings, kind, striker_key, non_striker_key, bowler_key, delivery_kind, runs, total_runs,
    is_legal, dismissal, out_key, next_batter_key, fielder_key, angle
  ) values (
    v_row.id, v_row.match_id, v_row.innings, v_row.kind, nullif(v_row.striker_key, ''),
    nullif(v_row.non_striker_key, ''), nullif(v_row.bowler_key, ''), v_row.delivery_kind, v_row.runs,
    v_row.total_runs, v_row.is_legal, v_row.dismissal, nullif(v_row.out_key, ''),
    nullif(v_row.next_batter_key, ''), nullif(v_row.fielder_key, ''), v_row.angle
  );
  update public.matches set score_head = v_row.id where id = v_row.match_id;
end;
$$;

-- Undo: voids the event and every later one in the match.
create function public.void_ball_events_from(p_match uuid, p_event uuid, p_op uuid, p_expected_head uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_seq bigint;
begin
  perform public.begin_scoring_write(p_match);
  if not public.claim_score_head(p_match, p_op, p_expected_head) then
    return;
  end if;
  select e.seq into v_seq from public.ball_events e where e.id = p_event and e.match_id = p_match;
  if v_seq is null then
    raise exception 'This event is not in this match' using errcode = 'P0002';
  end if;
  update public.ball_events set voided_at = now()
  where match_id = p_match and seq >= v_seq and voided_at is null;
  update public.matches set score_head = p_op where id = p_match;
end;
$$;

-- Final result. Only the `ResultUpdate` columns are written, and the status is always completed.
create function public.save_match_result(p_match uuid, p_result jsonb, p_op uuid, p_expected_head uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_row public.matches;
begin
  perform public.begin_scoring_write(p_match);
  if p_result is null or jsonb_typeof(p_result) <> 'object' then
    raise exception 'The result must be a JSON object' using errcode = '22023';
  end if;
  if not public.claim_score_head(p_match, p_op, p_expected_head) then
    return;
  end if;
  v_row := jsonb_populate_record(null::public.matches, p_result);
  update public.matches set
    status = 'completed', completed_at = v_row.completed_at,
    team_a_runs = v_row.team_a_runs, team_a_wickets = v_row.team_a_wickets, team_a_balls = v_row.team_a_balls,
    team_b_runs = v_row.team_b_runs, team_b_wickets = v_row.team_b_wickets, team_b_balls = v_row.team_b_balls,
    winner_side = v_row.winner_side, result_type = v_row.result_type, result_margin = v_row.result_margin,
    result_summary = v_row.result_summary, score_head = p_op
  where id = p_match;
end;
$$;

-- Undoing the last ball of a finished match puts it back to live and clears the result.
create function public.reopen_match(p_match uuid, p_op uuid, p_expected_head uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.begin_scoring_write(p_match);
  if not public.claim_score_head(p_match, p_op, p_expected_head) then
    return;
  end if;
  update public.matches set
    status = 'live', completed_at = null, winner_side = null, result_type = null, result_margin = null,
    result_summary = null, team_a_runs = null, team_a_wickets = null, team_a_balls = null,
    team_b_runs = null, team_b_wickets = null, team_b_balls = null, score_head = p_op
  where id = p_match;
end;
$$;

revoke execute on function public.append_ball_event(jsonb, uuid) from public, anon;
revoke execute on function public.void_ball_events_from(uuid, uuid, uuid, uuid) from public, anon;
revoke execute on function public.save_match_result(uuid, jsonb, uuid, uuid) from public, anon;
revoke execute on function public.reopen_match(uuid, uuid, uuid) from public, anon;
grant execute on function public.append_ball_event(jsonb, uuid) to authenticated;
grant execute on function public.void_ball_events_from(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.save_match_result(uuid, jsonb, uuid, uuid) to authenticated;
grant execute on function public.reopen_match(uuid, uuid, uuid) to authenticated;
