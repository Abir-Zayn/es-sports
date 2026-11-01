-- Scorer handover and creator recovery for friendly matches.
--
-- * A friendly match has one active scorer (`friendly_single_scorer`). Until now, if that person left or lost
--   their phone, the match could not continue.
-- * `scorer_handover` tracks a 15-minute offer from the current scorer to another signed-in player, or a
--   takeover offer by the match creator when the match has had no new ball for 15 minutes (or has no balls).
-- * Every state change runs through security-definer functions that take the same `score_match:<match_id>`
--   advisory lock as `begin_scoring_write`, so a ball write and a scorer swap can never interleave.
-- * `friendly_single_scorer` stays untouched: `accept_scorer_handover` deletes the old `match_scorers` row
--   before inserting the new one in the same transaction.

create table if not exists public.scorer_handover (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  initiated_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint scorer_handover_different_users check (to_user <> from_user),
  constraint scorer_handover_resolved_when_closed check ((status = 'pending') = (resolved_at is null))
);

create unique index if not exists scorer_handover_one_pending_idx
  on public.scorer_handover (match_id) where status = 'pending';
alter table public.scorer_handover enable row level security;
revoke all on public.scorer_handover from public, anon;
revoke insert, update, delete, truncate on public.scorer_handover from authenticated;
grant select on public.scorer_handover to authenticated;
drop policy if exists "scorer_handover: participants and creator can read" on public.scorer_handover;
create policy "scorer_handover: participants and creator can read"
  on public.scorer_handover for select to authenticated
  using (
    (select auth.uid()) in (from_user, to_user, initiated_by)
    or exists (select 1 from public.matches m where m.id = match_id and m.created_by = (select auth.uid()))
  );

-- Re-check `can_score_match` after acquiring the per-match lock so an in-flight write that waited on a
-- handover swap fails with 42501 as soon as the swap commits.
create or replace function public.begin_scoring_write(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in to score this match' using errcode = '42501'; end if;
  if p_match is null or not public.can_score_match(p_match) then
    raise exception 'You are not allowed to score this match' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || p_match::text, 0));
  if not public.can_score_match(p_match) then
    raise exception 'You are not allowed to score this match' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.begin_scoring_write(uuid) from public, anon, authenticated;

create or replace function public.offer_scorer_handover(p_match uuid, p_to uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
  v_scorer uuid;
  v_id uuid;
begin
  if v_uid is null or p_match is null then raise exception 'Sign in to hand over scoring' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || p_match::text, 0));
  update public.scorer_handover set status = 'expired', resolved_at = now()
  where match_id = p_match and status = 'pending' and expires_at <= now();
  select * into v_match from public.matches where id = p_match;
  if not found or coalesce(v_match.fixture_ref, '') not like 'friendly-%' then
    raise exception 'You are not allowed to hand over scoring for this match' using errcode = '42501';
  end if;
  select coalesce((select s.user_id from public.match_scorers s where s.match_id = p_match limit 1), v_match.created_by)
  into v_scorer;
  if v_uid is distinct from v_scorer and v_uid is distinct from v_match.created_by then
    raise exception 'You are not allowed to hand over scoring for this match' using errcode = '42501';
  end if;
  if v_match.status = 'completed' then raise exception 'This match is finished' using errcode = 'ESH05'; end if;
  if p_to is null or p_to is not distinct from v_scorer or not exists (select 1 from public.profiles p where p.id = p_to) then
    raise exception 'Choose another signed-in player to score this match' using errcode = '42501';
  end if;
  if v_uid is distinct from v_scorer and exists (
    select 1 from public.ball_events e where e.match_id = p_match and e.created_at > now() - interval '15 minutes'
  ) then
    raise exception 'The scorer was active a moment ago' using errcode = 'ESH04';
  end if;
  update public.scorer_handover set status = 'cancelled', resolved_at = now()
  where match_id = p_match and status = 'pending' and from_user is distinct from v_scorer;
  if exists (select 1 from public.scorer_handover h where h.match_id = p_match and h.status = 'pending') then
    raise exception 'Scoring is already being handed over' using errcode = 'ESH02';
  end if;
  insert into public.scorer_handover (match_id, from_user, to_user, initiated_by, status, created_at, expires_at)
  values (p_match, v_scorer, p_to, v_uid, 'pending', now(), now() + interval '15 minutes')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.accept_scorer_handover(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.scorer_handover;
  v_match public.matches;
  v_scorer uuid;
begin
  if v_uid is null or p_id is null then raise exception 'Sign in to accept scoring' using errcode = '42501'; end if;
  select * into v_offer from public.scorer_handover where id = p_id;
  if not found then raise exception 'You are not allowed to accept this scoring request' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || v_offer.match_id::text, 0));
  update public.scorer_handover set status = 'expired', resolved_at = now()
  where match_id = v_offer.match_id and status = 'pending' and expires_at <= now();
  select * into v_offer from public.scorer_handover where id = p_id;
  if v_offer.to_user is distinct from v_uid then
    raise exception 'You are not allowed to accept this scoring request' using errcode = '42501';
  end if;
  if v_offer.status = 'accepted' then return; end if;
  if v_offer.status <> 'pending' then raise exception 'This scoring request is no longer open' using errcode = 'ESH01'; end if;
  select * into v_match from public.matches where id = v_offer.match_id;
  if not found or coalesce(v_match.fixture_ref, '') not like 'friendly-%' then
    raise exception 'You are not allowed to accept this scoring request' using errcode = '42501';
  end if;
  if v_match.status = 'completed' then raise exception 'This match is finished' using errcode = 'ESH05'; end if;
  select coalesce((select s.user_id from public.match_scorers s where s.match_id = v_offer.match_id limit 1), v_match.created_by)
  into v_scorer;
  if v_scorer is distinct from v_offer.from_user then
    update public.scorer_handover set status = 'cancelled', resolved_at = now() where id = p_id;
    raise exception 'The scorer changed' using errcode = 'ESH03';
  end if;
  if v_offer.initiated_by is distinct from v_offer.from_user and exists (
    select 1 from public.ball_events e where e.match_id = v_offer.match_id and e.created_at > now() - interval '15 minutes'
  ) then
    raise exception 'The scorer was active a moment ago' using errcode = 'ESH04';
  end if;
  delete from public.match_scorers where match_id = v_offer.match_id;
  insert into public.match_scorers (match_id, user_id) values (v_offer.match_id, v_offer.to_user);
  update public.scorer_handover set status = 'accepted', resolved_at = now() where id = p_id;
end;
$$;

create or replace function public.decline_scorer_handover(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.scorer_handover;
begin
  if v_uid is null or p_id is null then raise exception 'Sign in to decline scoring' using errcode = '42501'; end if;
  select * into v_offer from public.scorer_handover where id = p_id;
  if not found then raise exception 'You are not allowed to decline this scoring request' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || v_offer.match_id::text, 0));
  update public.scorer_handover set status = 'expired', resolved_at = now()
  where match_id = v_offer.match_id and status = 'pending' and expires_at <= now();
  select * into v_offer from public.scorer_handover where id = p_id;
  if v_offer.to_user is distinct from v_uid then
    raise exception 'You are not allowed to decline this scoring request' using errcode = '42501';
  end if;
  if v_offer.status = 'declined' then return; end if;
  if v_offer.status <> 'pending' then raise exception 'This scoring request is no longer open' using errcode = 'ESH01'; end if;
  update public.scorer_handover set status = 'declined', resolved_at = now() where id = p_id;
end;
$$;

create or replace function public.cancel_scorer_handover(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.scorer_handover;
  v_creator uuid;
begin
  if v_uid is null or p_id is null then raise exception 'Sign in to cancel scoring' using errcode = '42501'; end if;
  select * into v_offer from public.scorer_handover where id = p_id;
  if not found then raise exception 'You are not allowed to cancel this scoring request' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('score_match:' || v_offer.match_id::text, 0));
  update public.scorer_handover set status = 'expired', resolved_at = now()
  where match_id = v_offer.match_id and status = 'pending' and expires_at <= now();
  select * into v_offer from public.scorer_handover where id = p_id;
  select m.created_by into v_creator from public.matches m where m.id = v_offer.match_id;
  if v_uid is distinct from v_offer.initiated_by and v_uid is distinct from v_offer.from_user and v_uid is distinct from v_creator then
    raise exception 'You are not allowed to cancel this scoring request' using errcode = '42501';
  end if;
  if v_offer.status = 'cancelled' then return; end if;
  if v_offer.status <> 'pending' then raise exception 'This scoring request is no longer open' using errcode = 'ESH01'; end if;
  update public.scorer_handover set status = 'cancelled', resolved_at = now() where id = p_id;
end;
$$;

revoke execute on function public.offer_scorer_handover(uuid, uuid), public.accept_scorer_handover(uuid),
  public.decline_scorer_handover(uuid), public.cancel_scorer_handover(uuid) from public, anon;
grant execute on function public.offer_scorer_handover(uuid, uuid), public.accept_scorer_handover(uuid),
  public.decline_scorer_handover(uuid), public.cancel_scorer_handover(uuid) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scorer_handover') then
    alter publication supabase_realtime add table public.scorer_handover;
  end if;
end $$;
