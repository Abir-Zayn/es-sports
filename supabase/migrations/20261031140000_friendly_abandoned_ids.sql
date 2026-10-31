-- Abandoned friendly setups: lets the image sweep delete team images without racing a late save.
--
-- * The sweep removes `avatars/<user>/friendly/<id>/` when no match has that id and the files are a day old.
--   A phone paused between uploading images and saving could still create the match after that check, and
--   the new match would point at deleted images.
-- * `abandon_friendly_matches(ids)` takes the same advisory lock as `create_friendly_match` for each id. If no
--   match exists, it records the id here; from then on the id can never become a match (trigger below). The
--   sweep deletes images only for the ids this returns, so a delete never races a save.
-- * Ids are client-generated uuids, so recording one cannot block another user's setup in practice. Rows are
--   per account and never updated or deleted by the app; they are a few bytes each.

create table public.friendly_abandoned_ids (
  match_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  abandoned_at timestamptz not null default now()
);

alter table public.friendly_abandoned_ids enable row level security;
revoke update, delete, truncate on public.friendly_abandoned_ids from authenticated, anon;
create policy "friendly_abandoned_ids: owner can read"
  on public.friendly_abandoned_ids for select to authenticated using (user_id = (select auth.uid()));
create policy "friendly_abandoned_ids: owner can add"
  on public.friendly_abandoned_ids for insert to authenticated with check (user_id = (select auth.uid()));

-- An abandoned id can never be inserted as a match, whichever path writes it. Security definer so the check
-- sees every account's rows, not only the caller's.
create function public.reject_abandoned_match() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.friendly_abandoned_ids where match_id = new.id) then
    raise exception 'This match setup expired. Start the toss again.' using errcode = 'EFA01';
  end if;
  return new;
end;
$$;
revoke all on function public.reject_abandoned_match() from public, anon, authenticated;
create trigger matches_reject_abandoned before insert on public.matches
  for each row execute function public.reject_abandoned_match();

-- Marks ids with no match as abandoned and returns every given id the caller has abandoned (new or earlier),
-- so a sweep whose delete failed can retry. Ids that have a match are never returned.
create function public.abandon_friendly_matches(p_ids uuid[]) returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_out uuid[] := '{}';
begin
  if v_uid is null then
    raise exception 'Sign in to clean up friendly setups' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_ids), 0) > 100 then
    raise exception 'Abandon at most 100 ids at a time' using errcode = '22023';
  end if;
  -- Sorted, so two sweeps at once take their locks in the same order. A create holds only one lock.
  for v_id in select distinct u.id from unnest(p_ids) u(id) where u.id is not null order by 1 loop
    perform pg_advisory_xact_lock(hashtextextended('create_friendly_match:' || v_id::text, 0));
    if not exists (select 1 from public.matches where id = v_id) then
      insert into public.friendly_abandoned_ids (match_id, user_id) values (v_id, v_uid)
      on conflict (match_id) do nothing;
    end if;
    if exists (select 1 from public.friendly_abandoned_ids where match_id = v_id and user_id = v_uid) then
      v_out := v_out || v_id;
    end if;
  end loop;
  return v_out;
end;
$$;

revoke execute on function public.abandon_friendly_matches(uuid[]) from public, anon;
grant execute on function public.abandon_friendly_matches(uuid[]) to authenticated;
