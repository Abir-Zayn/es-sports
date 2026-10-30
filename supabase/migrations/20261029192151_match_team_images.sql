-- Optional team images for match snapshots. Existing matches keep a null image.
alter table public.matches
  add column team_a_image_url text,
  add column team_b_image_url text;
