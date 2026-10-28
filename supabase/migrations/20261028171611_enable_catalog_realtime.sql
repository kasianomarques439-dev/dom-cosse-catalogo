-- Permite que o catálogo aberto receba alterações de produtos e contatos
-- após operações autenticadas no painel, sem precisar de um novo deploy.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'A publicação supabase_realtime não está disponível neste projeto.';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    execute 'alter publication supabase_realtime add table public.products';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'store_settings'
  ) then
    execute 'alter publication supabase_realtime add table public.store_settings';
  end if;
end
$$;
