-- Verification for custom overs (migration tournament_custom_overs). Run as an administrator; everything rolls back.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('fba00000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'overs-test-1@example.invalid', '{"provider":"email","providers":[]}'::jsonb, '{"full_name":"Overs test"}'::jsonb, now(), now());
insert into public.profiles (id, full_name) values ('fba00000-0000-4000-8000-000000000001', 'Overs test') on conflict (id) do nothing;

select set_config('t.body', jsonb_build_object('name', 'Overs Cup', 'city', 'Chattogram', 'venue', 'Ground',
  'start_date', current_date + 7, 'end_date', current_date + 9, 'competition', 'league', 'teams_planned', 4,
  'ball', 'Tennis', 'side_format', 'gully_6', 'players_per_side', 6, 'min_squad', 6, 'max_squad', 8)::text, true);
select set_config('request.jwt.claims', '{"sub":"fba00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

do $$
declare body jsonb := current_setting('t.body')::jsonb; code text; n int;
begin
  -- a) The new app sends overs: 12 overs is stored as 12 with the label T12; 50 is labelled ODI.
  perform public.create_tournament(body || '{"id":"fbc00000-0000-4000-8000-000000000001","overs":12}');
  perform public.create_tournament(body || '{"id":"fbc00000-0000-4000-8000-000000000002","overs":50}');
  if (select overs || '/' || match_format from public.tournaments where id = 'fbc00000-0000-4000-8000-000000000001') <> '12/T12'
    or (select overs || '/' || match_format from public.tournaments where id = 'fbc00000-0000-4000-8000-000000000002') <> '50/ODI' then
    raise exception 'FAIL a: overs or label wrong';
  end if;
  -- b) An older app sends only match_format: T10 becomes 10 overs.
  perform public.create_tournament(body || '{"id":"fbc00000-0000-4000-8000-000000000003","match_format":"T10"}');
  if (select overs || '/' || match_format from public.tournaments where id = 'fbc00000-0000-4000-8000-000000000003') <> '10/T10' then
    raise exception 'FAIL b: old client';
  end if;
  -- c) 3, 51, a fraction and nothing at all are refused with 22023.
  foreach n in array array[3, 51] loop
    code := null;
    begin perform public.create_tournament(body || jsonb_build_object('id', 'fbc00000-0000-4000-8000-000000000009', 'overs', n));
    exception when others then code := sqlstate; end;
    if code is distinct from '22023' then raise exception 'FAIL c: % overs gave %', n, code; end if;
  end loop;
  code := null;
  begin perform public.create_tournament(body || '{"id":"fbc00000-0000-4000-8000-000000000009"}'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL c: missing overs gave %', code; end if;
  code := null;
  begin perform public.create_tournament(body || '{"id":"fbc00000-0000-4000-8000-000000000009","overs":"twelve"}'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL c: text overs gave %', code; end if;
end $$;

reset role;
do $$
begin
  -- d) Ground time: 4 overs 1 h, 10 overs 2 h, 12 overs 2.5 h, 20 overs 4 h, 50 overs capped at 8 h.
  if (select string_agg(public.fixture_slot_minutes_for_overs(n)::text, ',' order by n) from unnest(array[4, 10, 12, 20, 50]) n)
     <> '60,120,150,240,480' then
    raise exception 'FAIL d: slot minutes';
  end if;
  -- e) Every existing tournament has overs that match its label.
  if exists (select 1 from public.tournaments where match_format <> case when overs = 50 then 'ODI' else 'T' || overs end) then
    raise exception 'FAIL e: label out of step';
  end if;
end $$;

rollback;
