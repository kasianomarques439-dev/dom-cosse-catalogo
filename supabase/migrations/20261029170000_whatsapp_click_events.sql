-- A click measures intent to open WhatsApp, not a message sent or a sale.
create table if not exists public.whatsapp_click_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  page_path text not null check (char_length(page_path) between 1 and 200),
  category text check (category is null or char_length(category) between 1 and 48),
  product_id uuid,
  placement text not null check (placement in ('hero', 'mobile_sticky', 'header', 'product_card', 'product_modal', 'product_page', 'contact', 'footer', 'floating'))
);

create index if not exists whatsapp_click_events_occurred_at_idx on public.whatsapp_click_events (occurred_at desc);
create index if not exists whatsapp_click_events_product_idx on public.whatsapp_click_events (product_id, occurred_at desc) where product_id is not null;
alter table public.whatsapp_click_events enable row level security;
alter table public.whatsapp_click_events force row level security;
revoke all on public.whatsapp_click_events from public, anon, authenticated;
grant select, insert on public.whatsapp_click_events to service_role;
grant usage, select on sequence public.whatsapp_click_events_id_seq to service_role;
