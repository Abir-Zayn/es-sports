-- pg_net was created in `public` by 20261118214856_push_notifications.sql; the security advisor wants extensions out
-- of the exposed schema. Its functions stay in the `net` schema, so the `send-push` cron job is unchanged.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
