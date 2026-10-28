create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;
revoke all on public.admin_users from public, anon, authenticated;
grant select on public.admin_users to authenticated;
drop policy if exists "admin can read own grant" on public.admin_users;
create policy "admin can read own grant" on public.admin_users for select to authenticated using (auth.uid() = user_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(10,2) not null check (price >= 0),
  category text not null check (category in ('cuias','bombas')),
  status text not null default 'disponivel' check (status in ('disponivel','esgotado')),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.products force row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
drop policy if exists "public reads catalog" on public.products;
create policy "public reads catalog" on public.products for select to anon, authenticated using (true);
drop policy if exists "admins create catalog" on public.products;
create policy "admins create catalog" on public.products for insert to authenticated with check (exists(select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins update catalog" on public.products;
create policy "admins update catalog" on public.products for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins delete catalog" on public.products;
create policy "admins delete catalog" on public.products for delete to authenticated using (exists(select 1 from public.admin_users a where a.user_id = auth.uid()));
create index if not exists products_category_status_idx on public.products(category, status);
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

create table if not exists public.store_settings (
  id boolean primary key default true check(id),
  whatsapp text not null default '',
  instagram text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.store_settings(id) values (true) on conflict do nothing;
alter table public.store_settings enable row level security;
alter table public.store_settings force row level security;
revoke all on public.store_settings from public, anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
drop policy if exists "public reads contact settings" on public.store_settings;
create policy "public reads contact settings" on public.store_settings for select to anon, authenticated using (id = true);
drop policy if exists "admins update contact settings" on public.store_settings;
create policy "admins update contact settings" on public.store_settings for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id = auth.uid()));

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
alter table public.admin_audit force row level security;
revoke all on public.admin_audit from public, anon, authenticated;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create or replace function private.audit_admin_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_audit(actor_id,action,entity,entity_id)
  values(auth.uid(),tg_op,tg_table_name,case when tg_op='DELETE' then old.id::text else new.id::text end);
  return coalesce(new,old);
end $$;
revoke execute on function private.audit_admin_change() from public, anon, authenticated;
drop trigger if exists products_audit on public.products;
create trigger products_audit after insert or update or delete on public.products for each row execute function private.audit_admin_change();
drop trigger if exists settings_audit on public.store_settings;
create trigger settings_audit after update on public.store_settings for each row execute function private.audit_admin_change();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "public reads product images" on storage.objects;
create policy "public reads product images" on storage.objects for select to anon, authenticated using (bucket_id='product-images');
drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists(select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins update own product images" on storage.objects;
create policy "admins update own product images" on storage.objects for update to authenticated using (bucket_id='product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists(select 1 from public.admin_users a where a.user_id = auth.uid())) with check (bucket_id='product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists(select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins delete own product images" on storage.objects;
create policy "admins delete own product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists(select 1 from public.admin_users a where a.user_id = auth.uid()));
