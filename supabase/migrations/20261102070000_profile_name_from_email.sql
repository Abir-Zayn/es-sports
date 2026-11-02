-- Email sign-ups send no name, so their profile was saved with full_name = null. The app already shows such a
-- player as the first part of their email (profile-provider), but player search matches full_name only and skips
-- null names, so nobody could find or invite them. Store the same fallback on the server:
--   1. New accounts: provider name first (Google), else the email's first part.
--   2. Existing accounts with no name get the email's first part.
-- The player can change it any time from Edit profile.

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text := nullif(left(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), 40), '');
  picture text := nullif(btrim(coalesce(meta ->> 'avatar_url', meta ->> 'picture', '')), '');
begin
  if display_name is null then
    display_name := nullif(left(btrim(split_part(coalesce(new.email, ''), '@', 1)), 40), '');
  end if;
  if picture is not null and picture !~ '^https://' then
    picture := null;
  end if;

  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, display_name, picture)
  on conflict (id) do nothing;

  return new;
exception when others then
  -- A profile problem must never block sign-up. The app creates the row on first load instead.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

update public.profiles p
set full_name = left(btrim(split_part(u.email, '@', 1)), 40), updated_at = now()
from auth.users u
where u.id = p.id
  and p.full_name is null
  and nullif(btrim(split_part(coalesce(u.email, ''), '@', 1)), '') is not null;
