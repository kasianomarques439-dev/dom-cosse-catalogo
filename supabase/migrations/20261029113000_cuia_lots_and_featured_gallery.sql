begin;

-- Preserve existing categories and products; add the lots category only if missing.
insert into public.categories (slug, name, icon)
values ('lotes-de-cuias', 'Lotes de Cuias', 'cuia')
on conflict (slug) do nothing;

alter table public.products
  add column if not exists lot_quantity smallint,
  add column if not exists is_featured boolean not null default false;

alter table public.products alter column price drop not null;

alter table public.products
  drop constraint if exists products_gallery_urls_count_check;
alter table public.products
  add constraint products_gallery_urls_count_check check (
    cardinality(gallery_urls) + case when image_url is null then 0 else 1 end
      <= case when category = 'lotes-de-cuias' then 48 else 10 end
  );

alter table public.products
  drop constraint if exists products_lot_quantity_check;
alter table public.products
  add constraint products_lot_quantity_check check (
    (category = 'lotes-de-cuias' and lot_quantity in (6, 12, 24, 36, 48))
    or (category <> 'lotes-de-cuias' and lot_quantity is null)
  );

create index if not exists products_featured_idx
  on public.products (is_featured, created_at desc)
  where is_featured = true;

commit;
