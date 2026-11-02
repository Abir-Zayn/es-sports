-- Verification for migration 20261102070000 (profile name falls back to the email's first part).
--
-- Run as an administrator after the migration is applied. Everything runs inside one transaction that is rolled
-- back. Any failed assertion raises an exception that starts with FAIL.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('f9a00000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'name-test-email-only@example.invalid', '{"provider":"email","providers":["email"]}', '{"email_verified":true}', now(), now()),
  ('f9a00000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'name-test-google@example.invalid', '{"provider":"google","providers":["google"]}', '{"full_name":"Rafi Ahmed"}', now(), now());

do $$
declare
  email_only text;
  google text;
begin
  select full_name into email_only from public.profiles where id = 'f9a00000-0000-4000-8000-000000000001';
  select full_name into google from public.profiles where id = 'f9a00000-0000-4000-8000-000000000002';
  if email_only is distinct from 'name-test-email-only' then
    raise exception 'FAIL email sign-up should be named after the email, got %', email_only;
  end if;
  if google is distinct from 'Rafi Ahmed' then
    raise exception 'FAIL a provider name should win over the email, got %', google;
  end if;
  if exists (select 1 from public.profiles p join auth.users u on u.id = p.id
             where p.full_name is null and nullif(split_part(coalesce(u.email, ''), '@', 1), '') is not null) then
    raise exception 'FAIL an account with an email still has no profile name';
  end if;
  if not exists (select 1 from public.profiles where id = 'f9a00000-0000-4000-8000-000000000001' and full_name ilike '%email-only%') then
    raise exception 'FAIL player search (full_name ilike) should find the email sign-up';
  end if;
end $$;

select 'PASS profile name from email' as result;
rollback;
