-- Tournament squads (workfile item 6): the members a team registers for one tournament.
--
-- * `tournament_squads` holds one row per registered player. The playing XI for each match is picked from it once
--   fixtures exist (Track B); this table is only the registered squad.
-- * A player is in at most one squad per tournament (unique on tournament and profile). A clash is ET002, the
--   same code as the one-playing-team rule.
-- * Rows go when the team leaves the tournament or the person leaves the team (both foreign keys cascade).
-- * `set_tournament_squad` replaces a team's squad in one call, so the app sends the whole list and a retry is
--   safe. Only the team owner or an admin may call it. Members only, never staff; at most `max_squad` players.
--   A squad smaller than `min_squad` is allowed while it is being built; the app shows how many are missing.
-- * After the registration deadline changes still go through, but every tournament staff member is notified of
--   who was added or removed (the server version of the roster audit trail).
-- * Locks: tournament row (`begin_tournament_change`), then team row (`begin_team_change`), like every other
--   tournament change.
-- * Error codes: 42501 not signed in or not allowed, 22023 invalid input, P0002 not found, ET002 player already
--   in another team's squad.

create table public.tournament_squads (
  tournament_id uuid not null,
  team_id uuid not null,
  profile_id uuid not null,
  added_by uuid references public.profiles (id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (tournament_id, team_id, profile_id),
  unique (tournament_id, profile_id),
  foreign key (tournament_id, team_id) references public.tournament_teams (tournament_id, team_id) on delete cascade,
  foreign key (team_id, profile_id) references public.team_members (team_id, profile_id) on delete cascade
);

create index tournament_squads_member_idx on public.tournament_squads (team_id, profile_id);
create index tournament_squads_added_by_idx on public.tournament_squads (added_by);

create or replace function public.set_tournament_squad(p_tournament uuid, p_team uuid, p_players uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_players uuid[] := coalesce(p_players, '{}');
  v_max int;
  v_deadline date;
  v_added int;
  v_removed int;
  v_role text;
begin
  perform public.begin_tournament_change(p_tournament);
  v_role := public.begin_team_change(p_team);
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only the team owner or an admin can choose the squad' using errcode = '42501';
  end if;
  if not exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team) then
    raise exception 'This team is not in the tournament' using errcode = '22023';
  end if;
  if array_position(v_players, null) is not null
     or cardinality(v_players) <> (select count(distinct p) from unnest(v_players) p) then
    raise exception 'Each player can be listed once' using errcode = '22023';
  end if;
  select max_squad, registration_deadline into v_max, v_deadline from public.tournaments where id = p_tournament;
  if cardinality(v_players) > v_max then
    raise exception 'A squad has at most % players', v_max using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(v_players) p
    left join public.team_members m on m.team_id = p_team and m.profile_id = p
    where m.profile_id is null or m.role = 'staff'
  ) then
    raise exception 'Only players in this team can be in its squad' using errcode = '22023';
  end if;

  delete from public.tournament_squads
   where tournament_id = p_tournament and team_id = p_team and profile_id <> all (v_players);
  get diagnostics v_removed = row_count;
  begin
    insert into public.tournament_squads (tournament_id, team_id, profile_id, added_by)
    select p_tournament, p_team, p, v_uid from unnest(v_players) p
    on conflict (tournament_id, team_id, profile_id) do nothing;
    get diagnostics v_added = row_count;
  exception when unique_violation then
    raise exception 'A player is already in another team''s squad in this tournament' using errcode = 'ET002';
  end;

  if v_deadline is not null and current_date > v_deadline and (v_added > 0 or v_removed > 0) then
    insert into public.notifications (user_id, kind, title, message, data)
    select s.user_id, 'system', 'Squad changed after registration closed',
      format('%s changed their squad: %s added, %s removed.', t.name, v_added, v_removed),
      jsonb_build_object('tournament_id', p_tournament, 'team_id', p_team, 'event', 'squad_changed',
        'added', v_added, 'removed', v_removed)
    from public.tournament_staff s cross join public.teams t
    where s.tournament_id = p_tournament and t.id = p_team and s.user_id <> v_uid;
  end if;
end $$;

revoke all on function public.set_tournament_squad(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.set_tournament_squad(uuid, uuid, uuid[]) to authenticated;

revoke all on public.tournament_squads from anon;
revoke insert, update, delete, truncate on public.tournament_squads from authenticated;
grant select on public.tournament_squads to authenticated;
alter table public.tournament_squads enable row level security;
create policy "tournament_squads: signed-in users can read"
  on public.tournament_squads for select to authenticated using (true);
