-- A friendly's assigned scorer replaces the creator as its scorer. Other match types keep their existing rules.
do $$
begin
  if exists (
    select 1 from public.match_scorers s join public.matches m on m.id = s.match_id
    where m.fixture_ref like 'friendly-%' group by s.match_id having count(*) > 1
  ) then raise exception 'Resolve friendly matches with multiple scorers before applying this migration'; end if;
end $$;

create or replace function public.can_score_match(p_match uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case
      when m.fixture_ref like 'friendly-%' and exists (select 1 from public.match_scorers s where s.match_id = m.id)
        then exists (select 1 from public.match_scorers s where s.match_id = m.id and s.user_id = (select auth.uid()))
      else m.created_by = (select auth.uid()) or exists (
        select 1 from public.match_scorers s where s.match_id = m.id and s.user_id = (select auth.uid())
      )
    end from public.matches m where m.id = p_match
  ), false);
$$;

-- Serialize assignment for a friendly and reject a second person, while allowing an idempotent retry.
create function public.check_friendly_scorer() returns trigger
language plpgsql security definer set search_path = '' as $$
declare ref text;
begin
  select fixture_ref into ref from public.matches where id = new.match_id for update;
  if ref like 'friendly-%' and exists (
    select 1 from public.match_scorers where match_id = new.match_id and user_id <> new.user_id
  ) then
    raise exception 'A friendly match can have only one assigned scorer';
  end if;
  return new;
end;
$$;
revoke all on function public.check_friendly_scorer() from public, anon, authenticated;
create trigger friendly_single_scorer before insert or update on public.match_scorers
  for each row execute function public.check_friendly_scorer();

-- A creator cannot remove an assigned friendly scorer to regain scoring access.
drop policy "match_scorers: creator can remove" on public.match_scorers;
create policy "match_scorers: creator can remove from non-friendly matches"
  on public.match_scorers for delete to authenticated using (
    exists (select 1 from public.matches m where m.id = match_id
      and m.created_by = (select auth.uid()) and coalesce(m.fixture_ref, '') not like 'friendly-%')
  );
