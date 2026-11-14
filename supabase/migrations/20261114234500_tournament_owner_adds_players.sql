-- Tournament owner adds players directly (no invites for now).
--
-- * `add_tournament_squad_player` puts a profile on a tournament team and into its squad in one call: the person
--   becomes a `player` member of the team if they are not one yet. Only the tournament owner or the team's
--   owner/admin may call it. The one-playing-team trigger (ET002) and the squad uniqueness still apply.
-- * `set_tournament_squad` now also lets the tournament owner choose the squad, same body otherwise.
-- * Error codes: 42501 not allowed, 22023 invalid input, ET002 already playing for another team.

create or replace function public.add_tournament_squad_player(p_tournament uuid, p_team uuid, p_profile uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_tournament_role text;
  v_team_role text;
  v_member_role text;
  v_max int;
begin
  v_tournament_role := public.begin_tournament_change(p_tournament);
  v_team_role := public.begin_team_change(p_team);
  if v_tournament_role is distinct from 'owner' and (v_team_role is null or v_team_role not in ('owner', 'admin')) then
    raise exception 'Only the tournament owner or the team owner can add players' using errcode = '42501';
  end if;
  if not exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team) then
    raise exception 'This team is not in the tournament' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile) then
    raise exception 'This player could not be found' using errcode = '22023';
  end if;
  if exists (select 1 from public.tournament_squads where tournament_id = p_tournament and team_id = p_team and profile_id = p_profile) then
    return;
  end if;
  select max_squad into v_max from public.tournaments where id = p_tournament;
  if (select count(*) from public.tournament_squads where tournament_id = p_tournament and team_id = p_team) >= v_max then
    raise exception 'A squad has at most % players', v_max using errcode = '22023';
  end if;
  select role into v_member_role from public.team_members where team_id = p_team and profile_id = p_profile;
  if v_member_role = 'staff' then
    raise exception 'Team staff cannot be in the squad' using errcode = '22023';
  end if;
  if v_member_role is null then
    insert into public.team_members (team_id, profile_id, role) values (p_team, p_profile, 'player');
  end if;
  begin
    insert into public.tournament_squads (tournament_id, team_id, profile_id, added_by)
    values (p_tournament, p_team, p_profile, v_uid);
  exception when unique_violation then
    raise exception 'This player is already in another team''s squad in this tournament' using errcode = 'ET002';
  end;
end $$;

revoke all on function public.add_tournament_squad_player(uuid, uuid, uuid) from public, anon;
grant execute on function public.add_tournament_squad_player(uuid, uuid, uuid) to authenticated;

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
  v_tournament_role text;
begin
  v_tournament_role := public.begin_tournament_change(p_tournament);
  v_role := public.begin_team_change(p_team);
  if v_tournament_role is distinct from 'owner' and (v_role is null or v_role not in ('owner', 'admin')) then
    raise exception 'Only the tournament owner, the team owner or an admin can choose the squad' using errcode = '42501';
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
