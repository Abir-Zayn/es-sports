-- Player profiles: public identity, private details, avatar storage, and a signup
-- trigger that pre-fills the name and photo from the sign-up provider (e.g. Google).
--
-- Name and photo are copied ONCE, when the account is created. After that the
-- profile row is the source of truth: the app never reads them back from auth
-- metadata, so editing a profile never touches the auth session, and linking a
-- Google account later (no new auth.users row) leaves the profile untouched.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  area text,
  district text,
  role text check (role in ('batter', 'bowler', 'all-rounder', 'keeper')),
  batting_style text check (batting_style in ('right', 'left')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sensitive details live apart from `profiles` so other players can read the
-- public profile without ever being able to read these columns.
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  national_id text,
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger profile_private_set_updated_at before update on public.profile_private
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

create policy "profiles: signed-in users can read"
  on public.profiles for select to authenticated using (true);
create policy "profiles: owner can insert"
  on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: owner can update"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "profile_private: owner can read"
  on public.profile_private for select to authenticated using ((select auth.uid()) = id);
create policy "profile_private: owner can insert"
  on public.profile_private for insert to authenticated with check ((select auth.uid()) = id);
create policy "profile_private: owner can update"
  on public.profile_private for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- New user -> profile (pre-fills Google name and photo)
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text := nullif(left(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), 40), '');
  picture text := nullif(btrim(coalesce(meta ->> 'avatar_url', meta ->> 'picture', '')), '');
begin
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that existed before this migration get a profile too.
insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  nullif(left(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), 40), ''),
  case
    when coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture', '') ~ '^https://'
    then coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
  end
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Avatar storage: public read, each user writes only inside their own folder
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: owner can list"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner can replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
