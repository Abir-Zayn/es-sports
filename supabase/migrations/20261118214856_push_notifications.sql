-- Push notifications (Expo Push API, delivered over FCM on Android).
--
-- * `push_tokens`: one row per device token. A device that signs in as someone else moves its token to them through
--   `register_push_token` (security definer), since RLS would hide the other user's row from a plain upsert.
-- * Every in-app `notifications` row is also pushed. `pushed_at` marks it sent; the `send-push` Edge Function claims
--   unsent rows with `claim_push_batch` (skip locked, so overlapping runs never send twice), sends, and records the
--   Expo tickets in `push_tickets` to read their receipts after 15 minutes (DeviceNotRegistered deletes the token).
-- * pg_cron calls the function each minute, but only when there is something to send or receipts to read. The
--   function takes no input and sends only what the database queued, so its URL needs no secret.
-- * Notifications, sent or not, are deleted after 30 days; tickets after a day.

create extension if not exists pg_net;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique check (token ~ '^Expo(nent)?PushToken\[.+\]$' and length(token) <= 200),
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public, anon, authenticated;
grant select, delete on public.push_tokens to authenticated;
create policy push_tokens_select_own on public.push_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy push_tokens_delete_own on public.push_tokens for delete to authenticated using (user_id = (select auth.uid()));

/** Saves this device's token for the signed-in user, taking it over from whoever had it before. */
create function public.register_push_token(p_token text, p_platform text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  insert into public.push_tokens (user_id, token, platform) values (v_uid, p_token, p_platform)
  on conflict (token) do update set user_id = v_uid, platform = excluded.platform, updated_at = now();
end $$;
revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

alter table public.notifications add column pushed_at timestamptz;
-- Rows that existed before push was set up are not pushed now.
update public.notifications set pushed_at = created_at where pushed_at is null;
create index notifications_unpushed_idx on public.notifications (created_at) where pushed_at is null;

create table public.push_tickets (
  id text primary key,
  token text not null,
  created_at timestamptz not null default now()
);
create index push_tickets_created_idx on public.push_tickets (created_at);
alter table public.push_tickets enable row level security;
revoke all on public.push_tickets from public, anon, authenticated;

/** Marks up to `p_limit` unsent notifications as sent and returns one row per device to push them to. */
create function public.claim_push_batch(p_limit int default 100)
returns table (notification_id uuid, token text, title text, message text, data jsonb)
language sql security definer set search_path = '' as $$
  with claimed as (
    update public.notifications n set pushed_at = now()
    where n.id in (
      select id from public.notifications where pushed_at is null order by created_at
      limit least(greatest(p_limit, 1), 500) for update skip locked
    )
    returning n.id, n.user_id, n.title, n.message, n.data
  )
  select c.id, t.token, c.title, c.message, c.data from claimed c join public.push_tokens t on t.user_id = c.user_id;
$$;
revoke all on function public.claim_push_batch(int) from public, anon, authenticated;
grant execute on function public.claim_push_batch(int) to service_role;

select cron.schedule('send-push', '* * * * *', $$
  select net.http_post(
    url := 'https://tedgyfczmqqnwrlucsoc.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  )
  where exists (select 1 from public.notifications where pushed_at is null)
     or exists (select 1 from public.push_tickets where created_at < now() - interval '15 minutes');
$$);

select cron.schedule('notification-retention', '17 3 * * *', $$
  delete from public.notifications where created_at < now() - interval '30 days';
  delete from public.push_tickets where created_at < now() - interval '1 day';
$$);
