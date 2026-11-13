begin;

-- Existing products remain visible because published defaults to true.
alter table public.products
  add column if not exists is_published boolean not null default true;

drop policy if exists "public reads catalog" on public.products;
drop policy if exists "public reads published catalog" on public.products;
drop policy if exists "admins read all catalog" on public.products;

create policy "public reads published catalog"
  on public.products for select to anon
  using (is_published);

create policy "admins read all catalog"
  on public.products for select to authenticated
  using (
    is_published
    or exists (
      select 1 from public.admin_users a
      where a.user_id = (select auth.uid())
    )
  );

commit;
