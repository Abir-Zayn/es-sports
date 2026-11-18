create table public.app_release_notes (
  update_id uuid primary key,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  published_at timestamptz not null default now(),
  highlights jsonb not null check (
    case when jsonb_typeof(highlights) = 'array' then
      jsonb_array_length(highlights) between 1 and 8
      and octet_length(highlights::text) <= 16000
      and not jsonb_path_exists(highlights, '$[*] ? (
        @.type() != "object" || !exists(@.title) || !exists(@.description)
        || @.title.type() != "string" || @.description.type() != "string"
      )')
    else false end
  )
);

alter table public.app_release_notes enable row level security;

revoke all on table public.app_release_notes from public, anon, authenticated;
grant select on table public.app_release_notes to authenticated;
grant select, insert, update, delete on table public.app_release_notes to service_role;

create policy "Signed-in users read published release notes"
on public.app_release_notes for select to authenticated
using (published_at <= now());

comment on column public.app_release_notes.update_id is
  'The platform-specific Expo Update ID reported by the running app.';
