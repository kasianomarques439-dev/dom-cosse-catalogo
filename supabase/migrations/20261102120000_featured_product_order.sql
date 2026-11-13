alter table public.products
  add column if not exists featured_order integer not null default 0;

create index if not exists products_featured_order_idx
  on public.products (featured_order asc, created_at desc)
  where is_featured = true and is_published = true;
