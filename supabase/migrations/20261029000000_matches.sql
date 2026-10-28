-- Match data: matches, per-match player roster, scorer assignments and the ball-by-ball event log.
--
-- * `matches.tournament_id` is nullable on purpose. A friendly or standalone match has none; a tournament
--   later becomes a parent row that matches point to. There is no tournaments table yet, so the foreign key
--   is added in the migration that creates it.
-- * Teams and players are a snapshot per match (no teams table yet). `match_players.profile_id` links a
--   roster entry to a real account when there is one.
-- * `ball_events` is an append-only log. Undo never deletes: it sets `voided_at`, and the live state is
--   rebuilt by replaying the events that are not voided. Rows carry a client-generated id, so a retried
--   write is harmless (insert ... on conflict do nothing).
-- * Anyone signed in can read. Only the match creator and assigned scorers can write.

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid,
  -- Id of the fixture a standalone match was scored from, so the scorer can resume it.
  fixture_ref text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  title text,
  team_a_name text not null,
  team_a_short text not null,
  team_a_tone text not null check (team_a_tone in ('blue', 'yellow', 'neutral')),
  team_b_name text not null,
  team_b_short text not null,
  team_b_tone text not null check (team_b_tone in ('blue', 'yellow', 'neutral')),
  overs_limit smallint not null default 20 check (overs_limit between 1 and 50),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed')),
  toss_winner_side text check (toss_winner_side in ('a', 'b')),
  toss_decision text check (toss_decision in ('bat', 'bowl')),
  record_shots boolean not null default true,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  -- Final totals per team, filled when the match completes.
  team_a_runs smallint,
  team_a_wickets smallint,
  team_a_balls smallint,
  team_b_runs smallint,
  team_b_wickets smallint,
  team_b_balls smallint,
  -- How it ended.
  winner_side text check (winner_side in ('a', 'b')),
  result_type text check (result_type in ('runs', 'wickets', 'tie')),
  result_margin smallint check (result_margin > 0),
  result_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_toss_complete check ((toss_winner_side is null) = (toss_decision is null)),
  -- A result exists exactly when the match is completed.
  constraint matches_result_when_completed check ((status = 'completed') = (result_type is not null)),
  constraint matches_winner_matches_result
    check (coalesce(result_type in ('runs', 'wickets'), false) = (winner_side is not null)),
  constraint matches_margin_matches_result
    check (coalesce(result_type in ('runs', 'wickets'), false) = (result_margin is not null))
);

create index matches_created_by_ref_idx on public.matches (created_by, fixture_ref);
create index matches_tournament_idx on public.matches (tournament_id) where tournament_id is not null;

create trigger matches_set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- match_players
-- ---------------------------------------------------------------------------

create table public.match_players (
  match_id uuid not null references public.matches (id) on delete cascade,
  -- The scorer's own player id (stable inside this match). Events refer to players by this key.
  key text not null,
  side text not null check (side in ('a', 'b')),
  name text not null,
  role text,
  in_playing_xi boolean not null default false,
  sort_order smallint not null,
  profile_id uuid references public.profiles (id) on delete set null,
  primary key (match_id, key)
);

create index match_players_profile_idx on public.match_players (profile_id) where profile_id is not null;

-- ---------------------------------------------------------------------------
-- match_scorers: users the creator lets score a match (the creator always can)
-- ---------------------------------------------------------------------------

create table public.match_scorers (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index match_scorers_user_idx on public.match_scorers (user_id);

-- Security definer so policies on other tables can ask "may this user score?" without recursing into RLS.
create function public.can_score_match(p_match uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.matches m where m.id = p_match and m.created_by = (select auth.uid()))
      or exists (select 1 from public.match_scorers s where s.match_id = p_match and s.user_id = (select auth.uid()));
$$;

revoke execute on function public.can_score_match(uuid) from public, anon;
grant execute on function public.can_score_match(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ball_events
-- ---------------------------------------------------------------------------

create table public.ball_events (
  id uuid primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  -- Order of events inside a match. Assigned by the database, never by the client.
  seq bigint generated always as identity,
  innings smallint not null check (innings in (1, 2)),
  kind text not null check (kind in ('innings_start', 'delivery', 'bowler', 'swap_ends')),
  striker_key text,
  non_striker_key text,
  bowler_key text,
  delivery_kind text check (delivery_kind in ('runs', 'wide', 'no-ball', 'bye', 'leg-bye', 'wicket')),
  -- Runs the scorer entered: off the bat, or completed extras on top of a wide / no-ball penalty.
  runs smallint check (runs between 0 and 6),
  total_runs smallint check (total_runs between 0 and 7),
  is_legal boolean,
  dismissal text check (dismissal in ('Bowled', 'Caught', 'LBW', 'Run out', 'Stumped', 'Caught & bowled', 'Hit wicket')),
  out_key text,
  next_batter_key text,
  fielder_key text,
  -- Shot direction in degrees, null when not recorded or skipped.
  angle double precision,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ball_events_shape check (
    (kind = 'innings_start' and striker_key is not null and non_striker_key is not null
      and bowler_key is not null and delivery_kind is null)
    or (kind = 'delivery' and delivery_kind is not null and striker_key is not null
      and non_striker_key is not null and bowler_key is not null
      and runs is not null and total_runs is not null and is_legal is not null)
    or (kind = 'bowler' and bowler_key is not null and delivery_kind is null)
    or (kind = 'swap_ends' and delivery_kind is null)
  ),
  constraint ball_events_wicket_has_dismissal check ((delivery_kind = 'wicket') = (dismissal is not null)),
  foreign key (match_id, striker_key) references public.match_players (match_id, key),
  foreign key (match_id, non_striker_key) references public.match_players (match_id, key),
  foreign key (match_id, bowler_key) references public.match_players (match_id, key),
  foreign key (match_id, out_key) references public.match_players (match_id, key),
  foreign key (match_id, next_batter_key) references public.match_players (match_id, key),
  foreign key (match_id, fielder_key) references public.match_players (match_id, key)
);

create index ball_events_match_seq_idx on public.ball_events (match_id, seq);

-- Undo: voids the given event and every event after it in the same match (a bowler choice that followed it).
-- Security invoker, so row level security still decides whether the caller may do this.
create function public.void_events_from(p_match uuid, p_event uuid) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  from_seq bigint;
  changed integer;
begin
  select seq into from_seq from public.ball_events where id = p_event and match_id = p_match;
  if from_seq is null then
    return 0;
  end if;
  update public.ball_events set voided_at = now()
  where match_id = p_match and seq >= from_seq and voided_at is null;
  get diagnostics changed = row_count;
  return changed;
end;
$$;

revoke execute on function public.void_events_from(uuid, uuid) from public, anon;
grant execute on function public.void_events_from(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges: nothing for signed-out users; events are append-only
-- ---------------------------------------------------------------------------

revoke all on public.matches, public.match_players, public.match_scorers, public.ball_events from anon;

-- Identity and ownership never change after creation.
revoke update on public.matches from authenticated;
grant update (
  status, toss_winner_side, toss_decision, record_shots, started_at, completed_at,
  team_a_runs, team_a_wickets, team_a_balls, team_b_runs, team_b_wickets, team_b_balls,
  winner_side, result_type, result_margin, result_summary
) on public.matches to authenticated;

-- Only the shot direction and the void flag can change on an event. Rows are never deleted.
revoke update, delete on public.ball_events from authenticated;
grant update (angle, voided_at) on public.ball_events to authenticated;
revoke delete on public.matches, public.match_players from authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_scorers enable row level security;
alter table public.ball_events enable row level security;

create policy "matches: signed-in users can read"
  on public.matches for select to authenticated using (true);
create policy "matches: creator can insert"
  on public.matches for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "matches: scorers can update"
  on public.matches for update to authenticated
  using (public.can_score_match(id)) with check (public.can_score_match(id));

create policy "match_players: signed-in users can read"
  on public.match_players for select to authenticated using (true);
create policy "match_players: scorers can insert"
  on public.match_players for insert to authenticated with check (public.can_score_match(match_id));
create policy "match_players: scorers can update"
  on public.match_players for update to authenticated
  using (public.can_score_match(match_id)) with check (public.can_score_match(match_id));

create policy "match_scorers: creator or the scorer can read"
  on public.match_scorers for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.matches m where m.id = match_id and m.created_by = (select auth.uid()))
  );
create policy "match_scorers: creator can add"
  on public.match_scorers for insert to authenticated
  with check (exists (select 1 from public.matches m where m.id = match_id and m.created_by = (select auth.uid())));
create policy "match_scorers: creator can remove"
  on public.match_scorers for delete to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and m.created_by = (select auth.uid())));

create policy "ball_events: signed-in users can read"
  on public.ball_events for select to authenticated using (true);
create policy "ball_events: scorers can insert"
  on public.ball_events for insert to authenticated with check (public.can_score_match(match_id));
create policy "ball_events: scorers can update"
  on public.ball_events for update to authenticated
  using (public.can_score_match(match_id)) with check (public.can_score_match(match_id));
