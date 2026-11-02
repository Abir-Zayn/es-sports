-- Player availability in a team (workfile item 5): available, injured or resting.
--
-- * Stored on `team_members`, so it follows the person in that team across every tournament the team enters.
--   An injured or resting player stays in the team and in tournament squads; the playing XI for a match
--   (after fixtures land) should not pick them.
-- * `set_team_member_availability`: the owner or an admin sets anyone's; a member may set their own. Staff
--   members do not play, so theirs cannot be set (22023). A repeat with the same value is a no-op.
-- * Error codes: 42501 not signed in or not allowed, 22023 invalid input, P0002 not a member.

alter table public.team_members
  add column availability text not null default 'available' check (availability in ('available', 'injured', 'resting')),
  add column availability_updated_at timestamptz;

create or replace function public.set_team_member_availability(p_team uuid, p_profile uuid, p_availability text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_caller text := public.begin_team_change(p_team);
  v_target text;
begin
  if v_caller is null then
    raise exception 'You are not a member of this team' using errcode = '42501';
  end if;
  if p_availability is null or p_availability not in ('available', 'injured', 'resting') then
    raise exception 'Choose available, injured or resting' using errcode = '22023';
  end if;
  v_target := public.team_member_role(p_team, p_profile);
  if p_profile is distinct from (select auth.uid()) and v_caller not in ('owner', 'admin') then
    raise exception 'Only the team owner or an admin can change this' using errcode = '42501';
  end if;
  if v_target = 'staff' then
    raise exception 'Staff members do not play' using errcode = '22023';
  end if;
  update public.team_members set availability = p_availability, availability_updated_at = now()
   where team_id = p_team and profile_id = p_profile and availability is distinct from p_availability;
end $$;

revoke all on function public.set_team_member_availability(uuid, uuid, text) from public, anon;
grant execute on function public.set_team_member_availability(uuid, uuid, text) to authenticated;
