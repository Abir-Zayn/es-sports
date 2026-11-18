-- Run as an administrator after the release-notes migration. Fixtures roll back.
begin;

insert into public.app_release_notes (update_id, title, published_at, highlights)
values
  ('7d757a34-6c0f-452b-9129-567ea6172752', 'Published release', now(),
    '[{"title":"Live matches","description":"Scores refresh sooner."}]'),
  ('7d757a34-6c0f-452b-9129-567ea6172753', 'Upcoming release', now() + interval '1 day',
    '[{"title":"Fixtures","description":"Find your next match."}]');

do $$
begin
  if has_table_privilege('anon', 'public.app_release_notes', 'select')
    or has_table_privilege('authenticated', 'public.app_release_notes', 'insert, update, delete') then
    raise exception 'FAIL: only signed-in clients can read notes and client writes are prohibited';
  end if;

  begin
    insert into public.app_release_notes (update_id, title, highlights)
    values ('7d757a34-6c0f-452b-9129-567ea6172754', 'Invalid release', '[{"title":"Missing description"}]');
    raise exception 'FAIL: malformed highlights should be rejected';
  exception when check_violation then
    null;
  end;
end $$;

set local role authenticated;

do $$
begin
  if (select title from public.app_release_notes where update_id = '7d757a34-6c0f-452b-9129-567ea6172752')
    is distinct from 'Published release' then
    raise exception 'FAIL: published notes are missing';
  end if;

  if exists (select 1 from public.app_release_notes where update_id = '7d757a34-6c0f-452b-9129-567ea6172753') then
    raise exception 'FAIL: scheduled notes are visible early';
  end if;
end $$;

rollback;
