alter table public.whatsapp_click_events
  drop constraint if exists whatsapp_click_events_placement_check;

alter table public.whatsapp_click_events
  add constraint whatsapp_click_events_placement_check
  check (placement in ('hero', 'essence', 'mobile_sticky', 'header', 'product_card', 'product_modal', 'product_page', 'contact', 'footer', 'floating'));
