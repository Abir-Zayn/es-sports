-- Tournament format simplification.
--
-- * Teams: a new tournament plans 8 to 24 teams. 4 and 6 stay valid so tournaments already published still load.
--   The old knockout bracket check (4, 8 or 16 teams) goes with it: the app no longer offers a knockout format.
-- * Elimination: the tournament owner knocks a team out by hand. `tournament_teams.eliminated_at` marks it; the team
--   stays entered so its results and squad remain visible. `set_tournament_team_eliminated` sets or clears it,
--   is idempotent, and notifies the team's owner when a team is eliminated.
-- * Error codes: 42501 not signed in or not the owner, 22023 invalid input, P0002 team not in this tournament.

do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.tournaments'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) like '%teams_planned%' loop
    execute format('alter table public.tournaments drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.tournaments add constraint tournaments_teams_planned_check check (teams_planned between 4 and 24);

alter table public.tournament_teams add column eliminated_at timestamptz;

create or replace function public.set_tournament_team_eliminated(p_tournament uuid, p_team uuid, p_eliminated boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_changed int;
  v_owner uuid;
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can eliminate a team' using errcode = '42501';
  end if;
  if p_team is null or p_eliminated is null then raise exception 'Choose a team' using errcode = '22023'; end if;
  perform 1 from public.teams where id = p_team for update;
  if not exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team) then
    raise exception 'This team is not in the tournament' using errcode = 'P0002';
  end if;
  update public.tournament_teams
     set eliminated_at = case when p_eliminated then now() else null end
   where tournament_id = p_tournament and team_id = p_team and (eliminated_at is not null) <> p_eliminated;
  get diagnostics v_changed = row_count;
  if v_changed = 0 or not p_eliminated then return; end if;
  select profile_id into v_owner from public.team_members where team_id = p_team and role = 'owner';
  if v_owner is not null and v_owner <> v_uid then
    insert into public.notifications (user_id, kind, title, message, data)
    values (v_owner, 'system', 'Team eliminated', 'The organiser eliminated your team from their tournament.',
      jsonb_build_object('tournament_id', p_tournament, 'team_id', p_team, 'event', 'team_eliminated'));
  end if;
end $$;

revoke all on function public.set_tournament_team_eliminated(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_tournament_team_eliminated(uuid, uuid, boolean) to authenticated;
