begin;

create table if not exists public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 48),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  icon text not null default 'shapes' check (icon in ('cuia', 'bomba', 'shapes')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed only missing rows; existing category labels and all product records stay intact.
insert into public.categories (slug, name, icon)
values ('cuias', 'Cuias', 'cuia'), ('bombas', 'Bombas', 'bomba')
on conflict (slug) do nothing;

alter table public.products
  add column if not exists gallery_urls text[] not null default '{}';

alter table public.products
  drop constraint if exists products_gallery_urls_count_check;
alter table public.products
  add constraint products_gallery_urls_count_check check (
    cardinality(gallery_urls) + case when image_url is null then 0 else 1 end <= 10
  );

alter table public.products
  drop constraint if exists products_category_check;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_category_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_fkey
      foreign key (category) references public.categories(slug)
      on update cascade on delete restrict;
  end if;
end
$$;

-- Preserve the existing cuia subcategory rule while allowing new categories.
alter table public.products
  drop constraint if exists products_cuia_subcategory_check;
alter table public.products
  add constraint products_cuia_subcategory_check check (
    (category = 'cuias' and (cuia_subcategory is null or cuia_subcategory in (
      'bago_virola_alpaca_4mm',
      'bago_virola_alpaca_6mm',
      'bago_virola_alpaca_10mm',
      'bago_virola_alpaca_15mm',
      'bago_virola_alpaca_25mm',
      'bago_bocal_alpaca_10mm',
      'bago_bocal_alpaca_15mm',
      'bago_bocal_alpaca_25mm'
    ))) or (category <> 'cuias' and cuia_subcategory is null)
  );

alter table public.categories enable row level security;
alter table public.categories force row level security;
revoke all on public.categories from public, anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
drop policy if exists "public reads categories" on public.categories;
create policy "public reads categories" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "admins create categories" on public.categories;
create policy "admins create categories" on public.categories
  for insert to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins update categories" on public.categories;
create policy "admins update categories" on public.categories
  for update to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins delete categories" on public.categories;
create policy "admins delete categories" on public.categories
  for delete to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create index if not exists categories_updated_at_idx on public.categories(updated_at desc);
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- Audit supports both the existing id columns and the categories.slug key.
create or replace function private.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_id text;
begin
  if tg_op = 'DELETE' then
    changed_id := coalesce(to_jsonb(old)->>'id', to_jsonb(old)->>'slug');
    insert into public.admin_audit(actor_id, action, entity, entity_id)
    values (auth.uid(), tg_op, tg_table_name, changed_id);
    return old;
  end if;

  changed_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'slug');
  insert into public.admin_audit(actor_id, action, entity, entity_id)
  values (auth.uid(), tg_op, tg_table_name, changed_id);
  return new;
end
$$;
revoke execute on function private.audit_admin_change() from public, anon, authenticated;
drop trigger if exists categories_audit on public.categories;
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function private.audit_admin_change();

-- Gallery removal is available to authorized administrators; uploads remain in
-- the authenticated user's own folder.
drop policy if exists "admins delete own product images" on storage.objects;
drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'A publicação supabase_realtime não está disponível neste projeto.';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    execute 'alter publication supabase_realtime add table public.categories';
  end if;
end
$$;

commit;
