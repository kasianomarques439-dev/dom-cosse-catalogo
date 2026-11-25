begin;

-- Additive configuration for the responsive customer banner and two store contacts.
alter table public.store_settings
  add column if not exists whatsapp_secondary text not null default '+55 55 3317-3112',
  add column if not exists showroom_text text not null default 'Showroom para atendimento a lojistas, com horário previamente agendado.',
  add column if not exists home_banner_desktop_url text,
  add column if not exists home_banner_mobile_url text,
  add column if not exists banner_desktop_cta_left numeric(5,2) not null default 12.70,
  add column if not exists banner_desktop_cta_top numeric(5,2) not null default 61.20,
  add column if not exists banner_desktop_cta_width numeric(5,2) not null default 37.60,
  add column if not exists banner_desktop_cta_height numeric(5,2) not null default 13.30,
  add column if not exists banner_mobile_cta_left numeric(5,2) not null default 12.40,
  add column if not exists banner_mobile_cta_top numeric(5,2) not null default 82.90,
  add column if not exists banner_mobile_cta_width numeric(5,2) not null default 74.90,
  add column if not exists banner_mobile_cta_height numeric(5,2) not null default 10.50;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='store_settings_banner_cta_bounds_check') then
    alter table public.store_settings add constraint store_settings_banner_cta_bounds_check check (
      banner_desktop_cta_left between 0 and 100 and banner_desktop_cta_top between 0 and 100 and
      banner_desktop_cta_width between 0 and 100 and banner_desktop_cta_height between 0 and 100 and
      banner_mobile_cta_left between 0 and 100 and banner_mobile_cta_top between 0 and 100 and
      banner_mobile_cta_width between 0 and 100 and banner_mobile_cta_height between 0 and 100 and
      banner_desktop_cta_left + banner_desktop_cta_width <= 100 and banner_desktop_cta_top + banner_desktop_cta_height <= 100 and
      banner_mobile_cta_left + banner_mobile_cta_width <= 100 and banner_mobile_cta_top + banner_mobile_cta_height <= 100
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='store_settings_home_banner_urls_check') then
    alter table public.store_settings add constraint store_settings_home_banner_urls_check check (
      (home_banner_desktop_url is null or home_banner_desktop_url like 'https://%/storage/v1/object/public/product-images/%') and
      (home_banner_mobile_url is null or home_banner_mobile_url like 'https://%/storage/v1/object/public/product-images/%')
    );
  end if;
end $$;

create table if not exists public.home_featured_products (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('cuia','bomba')),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 140),
  image_url text not null check (image_url like 'https://%/storage/v1/object/public/product-images/%'),
  badge text check (badge is null or char_length(badge) <= 60),
  position smallint not null check (position between 0 and 9),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_featured_products_active_order_idx on public.home_featured_products(is_active, position);
alter table public.home_featured_products enable row level security;
alter table public.home_featured_products force row level security;
revoke all on public.home_featured_products from public, anon, authenticated;
grant select on public.home_featured_products to anon, authenticated;
grant insert, update, delete on public.home_featured_products to authenticated;
create policy "public reads active home featured products" on public.home_featured_products for select to anon, authenticated using (is_active);
create policy "admins read all home featured products" on public.home_featured_products for select to authenticated using (exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "admins add home featured products" on public.home_featured_products for insert to authenticated with check (exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "admins edit home featured products" on public.home_featured_products for update to authenticated using (exists(select 1 from public.admin_users where user_id=auth.uid())) with check (exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "admins remove home featured products" on public.home_featured_products for delete to authenticated using (exists(select 1 from public.admin_users where user_id=auth.uid()));

drop trigger if exists home_featured_products_updated_at on public.home_featured_products;
create trigger home_featured_products_updated_at before update on public.home_featured_products for each row execute function public.set_updated_at();
drop trigger if exists home_featured_products_audit on public.home_featured_products;
create trigger home_featured_products_audit after insert or update or delete on public.home_featured_products for each row execute function private.audit_admin_change();

create or replace function private.enforce_home_featured_products_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare item_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('home_featured_products_limit'));
  select count(*) into item_count from public.home_featured_products where id <> new.id;
  if item_count >= 10 then raise exception 'O limite de 10 destaques foi atingido.'; end if;
  return new;
end $$;
revoke all on function private.enforce_home_featured_products_limit() from public, anon, authenticated;
drop trigger if exists home_featured_products_limit on public.home_featured_products;
create trigger home_featured_products_limit before insert on public.home_featured_products for each row execute function private.enforce_home_featured_products_limit();

commit;

-- Rollback: first export home_featured_products if it contains admin edits. Then remove its trigger,
-- policies, table and the two named store_settings constraints; drop only the added columns listed above.
