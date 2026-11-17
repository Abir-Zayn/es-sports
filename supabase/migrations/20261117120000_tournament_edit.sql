-- Editing a published tournament. The owner can change the overs, the playing days, the registration window and the
-- cover and profile images. Everything else (name, venue, teams, squads) stays as published.
--
-- * Owner only, through `begin_tournament_change`: a deleted tournament is P0002, a closed one ET014.
-- * The same rules as the create form: overs 4 to 50, end on or after start, registrations close by the start and
--   not before they open. A start date that moves must be today or later. Broken input is 22023.
-- * The existing schedule must still fit: every scheduled match on a tournament day and, with the new overs, no two
--   matches on the ground at once. Otherwise ET006 and nothing changes.
-- * Matches already started keep the overs they started with (`start_tournament_fixture` copies them).
-- * Images are public https URLs from the `avatars` bucket, or null to remove one.

create function public.update_tournament(
  p_tournament uuid, p_overs int, p_start_date date, p_end_date date,
  p_registration_opens date, p_registration_deadline date, p_cover_url text, p_profile_url text
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_old_start date; v_problem text;
begin
  if public.begin_tournament_change(p_tournament) is distinct from 'owner' then
    raise exception 'Only the tournament owner can edit it' using errcode = '42501';
  end if;
  select start_date into v_old_start from public.tournaments where id = p_tournament;
  if p_overs is null or p_overs not between 4 and 50 then
    raise exception 'Overs must be between 4 and 50' using errcode = '22023';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date' using errcode = '22023';
  end if;
  if p_start_date <> v_old_start and p_start_date < current_date then
    raise exception 'A new start date must be today or later' using errcode = '22023';
  end if;
  if p_registration_deadline is not null and (p_registration_deadline > p_start_date
      or p_registration_deadline < coalesce(p_registration_opens, p_registration_deadline)) then
    raise exception 'Registrations must close by the start date and after they open' using errcode = '22023';
  end if;
  if (p_cover_url is not null and p_cover_url !~ '^https://') or (p_profile_url is not null and p_profile_url !~ '^https://') then
    raise exception 'Images must be https links' using errcode = '22023';
  end if;

  update public.tournaments
     set overs = p_overs, start_date = p_start_date, end_date = p_end_date,
         registration_opens = p_registration_opens, registration_deadline = p_registration_deadline,
         cover_url = p_cover_url, profile_url = p_profile_url
   where id = p_tournament;

  v_problem := public.tournament_schedule_problem(p_tournament);
  if v_problem is not null then
    raise exception '%', v_problem using errcode = 'ET006';
  end if;
end;
$$;
revoke all on function public.update_tournament(uuid, int, date, date, date, date, text, text) from public, anon;
grant execute on function public.update_tournament(uuid, int, date, date, date, date, text, text) to authenticated;
