begin;

alter table public.home_highlights
  drop constraint if exists home_highlights_slot_check;

alter table public.home_highlights
  add constraint home_highlights_slot_check check (slot between 1 and 12);

commit;
