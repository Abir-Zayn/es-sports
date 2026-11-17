-- Deleting a tournament (soft delete with a 3-day restore window).
--
-- * `tournaments.deleted_at`: set by `delete_tournament`. A deleted tournament is hidden from everyone but its owner
--   (read policy) and refuses every change (`begin_tournament_change` treats it as not found).
-- * `restore_tournament`: the owner brings it back within 3 days of deleting it. Later is ET013.
-- * `purge_deleted_tournaments`: hard-deletes tournaments deleted more than 3 days ago. Staff, teams entered,
--   fixtures and invitations cascade; scored matches keep existing with no tournament (FK set null), so player
--   career stats survive. Run hourly by pg_cron.
-- * Owner only. Both calls are idempotent. Error codes: 42501 not signed in or not the owner, P0002 not found,
--   ET013 restore window over.

alter table public.tournaments add column deleted_at timestamptz;
create index tournaments_deleted_idx on public.tournaments (deleted_at) where deleted_at is not null;

drop policy "tournaments: signed-in users can read" on public.tournaments;
create policy "tournaments: signed-in users read live ones, owners also their deleted ones"
  on public.tournaments for select to authenticated
  using (deleted_at is null or owner_id = (select auth.uid()));

create or replace function public.begin_tournament_change(p_tournament uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to change this tournament' using errcode = '42501';
  end if;
  perform 1 from public.tournaments where id = p_tournament and deleted_at is null for update;
  if not found then
    raise exception 'This tournament could not be found' using errcode = 'P0002';
  end if;
  select role into v_role from public.tournament_staff where tournament_id = p_tournament and user_id = (select auth.uid());
  return v_role;
end;
$$;

-- Locks the tournament (deleted or not) and checks the caller owns it.
create function public.lock_owned_tournament(p_tournament uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare v_deleted timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to change this tournament' using errcode = '42501';
  end if;
  select deleted_at into v_deleted from public.tournaments where id = p_tournament for update;
  if not found then
    raise exception 'This tournament could not be found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.tournament_staff
                  where tournament_id = p_tournament and user_id = (select auth.uid()) and role = 'owner') then
    raise exception 'Only the tournament owner can delete or restore it' using errcode = '42501';
  end if;
  return v_deleted;
end;
$$;
revoke all on function public.lock_owned_tournament(uuid) from public, anon, authenticated;

create function public.delete_tournament(p_tournament uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.lock_owned_tournament(p_tournament) is not null then return; end if;
  update public.tournaments set deleted_at = now() where id = p_tournament;
  update public.invitations set status = 'cancelled', resolved_at = now()
   where tournament_id = p_tournament and status = 'pending';
end;
$$;

create function public.restore_tournament(p_tournament uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_deleted timestamptz := public.lock_owned_tournament(p_tournament);
begin
  if v_deleted is null then return; end if;
  if v_deleted < now() - interval '3 days' then
    raise exception 'This tournament was deleted more than 3 days ago and can no longer be restored' using errcode = 'ET013';
  end if;
  update public.tournaments set deleted_at = null where id = p_tournament;
end;
$$;

create function public.purge_deleted_tournaments() returns int
language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  delete from public.tournaments where deleted_at < now() - interval '3 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.delete_tournament(uuid), public.restore_tournament(uuid) from public, anon;
grant execute on function public.delete_tournament(uuid), public.restore_tournament(uuid) to authenticated;
revoke all on function public.purge_deleted_tournaments() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('purge-deleted-tournaments', '17 * * * *', 'select public.purge_deleted_tournaments()');
