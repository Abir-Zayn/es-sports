-- Closing a tournament. The owner closes it once play is over: `tournaments.closed_at` is set and every change
-- that goes through `begin_tournament_change` (teams, squads, schedule, starting fixtures, eliminations) is refused
-- with ET014. A match already being scored can still be finished. Closing is idempotent and owner only.
alter table public.tournaments add column closed_at timestamptz;

create or replace function public.begin_tournament_change(p_tournament uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_role text; v_closed timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to change this tournament' using errcode = '42501';
  end if;
  select closed_at into v_closed from public.tournaments where id = p_tournament and deleted_at is null for update;
  if not found then
    raise exception 'This tournament could not be found' using errcode = 'P0002';
  end if;
  if v_closed is not null then
    raise exception 'This tournament is closed' using errcode = 'ET014';
  end if;
  select role into v_role from public.tournament_staff where tournament_id = p_tournament and user_id = (select auth.uid());
  return v_role;
end;
$$;

create function public.close_tournament(p_tournament uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.lock_owned_tournament(p_tournament) is not null then
    raise exception 'This tournament could not be found' using errcode = 'P0002';
  end if;
  update public.tournaments set closed_at = now() where id = p_tournament and closed_at is null;
  update public.invitations set status = 'cancelled', resolved_at = now()
   where tournament_id = p_tournament and status = 'pending';
end;
$$;
revoke all on function public.close_tournament(uuid) from public, anon;
grant execute on function public.close_tournament(uuid) to authenticated;
