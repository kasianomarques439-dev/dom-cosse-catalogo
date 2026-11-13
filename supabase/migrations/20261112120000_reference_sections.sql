begin;

update storage.buckets set file_size_limit=10485760 where id='product-images';

create table if not exists public.catalog_sections (
  id uuid primary key default gen_random_uuid(),
  category text not null references public.categories(slug) on update cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  short_label text not null check (char_length(btrim(short_label)) between 1 and 100),
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists catalog_sections_category_order_idx on public.catalog_sections(category, position);
drop trigger if exists catalog_sections_updated_at on public.catalog_sections;
create trigger catalog_sections_updated_at before update on public.catalog_sections for each row execute function public.set_updated_at();
alter table public.catalog_sections enable row level security;
alter table public.catalog_sections force row level security;
revoke all on public.catalog_sections from public, anon, authenticated;
grant select on public.catalog_sections to anon, authenticated;
grant insert, update, delete on public.catalog_sections to authenticated;
create policy "public reads visible sections" on public.catalog_sections for select to anon using (is_visible);
create policy "admins read all sections" on public.catalog_sections for select to authenticated using (is_visible or exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "admins add sections" on public.catalog_sections for insert to authenticated with check (exists(select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins edit sections" on public.catalog_sections for update to authenticated using (exists(select 1 from public.admin_users where user_id = auth.uid())) with check (exists(select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins remove sections" on public.catalog_sections for delete to authenticated using (exists(select 1 from public.admin_users where user_id = auth.uid()));

create or replace function public.swap_catalog_sections(p_first uuid, p_second uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare first_category text; second_category text; first_position integer; second_position integer;
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid()) then raise exception 'Acesso não autorizado.'; end if;
  select category,position into first_category,first_position from public.catalog_sections where id=p_first for update;
  select category,position into second_category,second_position from public.catalog_sections where id=p_second for update;
  if first_category is null or second_category is null or first_category<>second_category then raise exception 'Seções inválidas.'; end if;
  update public.catalog_sections set position=case when id=p_first then second_position else first_position end where id in(p_first,p_second);
end $$;
revoke all on function public.swap_catalog_sections(uuid,uuid) from public,anon,authenticated;
grant execute on function public.swap_catalog_sections(uuid,uuid) to authenticated;

insert into public.catalog_sections(category,title,short_label,position)
select seed.category,seed.title,seed.short_label,seed.position from (values
 ('cuias','CUIA BAGO DE TORO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA*','Bago Virola Alpaca',0),
 ('cuias','CUIA BAGO DE TORO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA PÉ DE METAL*','Bago Virola Alpaca Pé de Metal',1),
 ('cuias','CUIA BAGO DE TORO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA COM CICATRIZ*','Bago Virola Alpaca com Cicatriz',2),
 ('cuias','CUIA BAGO DE TORO PREMIUM *BOCAL EM ALPACA*','Bago Premium Bocal Alpaca',3),
 ('cuias','CUIA BAGO DE TORO PREMIUM *BOCAL EM ALPACA COM CICATRIZ*','Bago Premium Bocal Alpaca com Cicatriz',4),
 ('cuias','CUIA BAGO DE TORO COM VIROLA EM ALPACA *MADEIRA DE LEI*','Bago Madeira de Lei',5),
 ('cuias','CUIA MÉDIA PORONGO FERRO BOCAL E PÉ DE METAL','Cuia Média Porongo Ferro',6),
 ('bombas','BOMBAS EM ALPACA ARTESANAIS *(FEITA A MÃO)*','Bombas em Alpaca Artesanais',7),
 ('bombas','BOMBA INOX TORCIDA','Bomba Inox Torcida',8)
) as seed(category,title,short_label,position)
where not exists(select 1 from public.catalog_sections s where s.title=seed.title and s.category=seed.category);

alter table public.products add column if not exists section_id uuid references public.catalog_sections(id) on delete cascade;
alter table public.products add column if not exists measure text check (measure in ('4mm','6mm','10mm','15mm','25mm'));
alter table public.products add column if not exists position integer not null default 0;
create index if not exists products_section_order_idx on public.products(section_id, position);

create or replace function public.swap_catalog_products(p_first uuid, p_second uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare first_section uuid; second_section uuid; first_position integer; second_position integer;
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid()) then raise exception 'Acesso não autorizado.'; end if;
  select section_id,position into first_section,first_position from public.products where id=p_first for update;
  select section_id,position into second_section,second_position from public.products where id=p_second for update;
  if first_section is null or second_section is null or first_section<>second_section then raise exception 'Produtos inválidos.'; end if;
  update public.products set position=case when id=p_first then second_position else first_position end where id in(p_first,p_second);
end $$;
revoke all on function public.swap_catalog_products(uuid,uuid) from public,anon,authenticated;
grant execute on function public.swap_catalog_products(uuid,uuid) to authenticated;

create table if not exists public.home_highlights (
  slot smallint primary key check (slot between 1 and 3),
  image_url text,
  alt_text text not null default '' check (char_length(alt_text) <= 160),
  title text not null default '' check (char_length(title) <= 120),
  link_url text check (char_length(link_url) <= 500),
  updated_at timestamptz not null default now()
);
alter table public.home_highlights add column if not exists title text not null default '';
alter table public.home_highlights add column if not exists link_url text;
insert into public.home_highlights(slot) values (1),(2),(3) on conflict do nothing;
alter table public.home_highlights enable row level security;
alter table public.home_highlights force row level security;
revoke all on public.home_highlights from public, anon, authenticated;
grant select on public.home_highlights to anon, authenticated;
grant insert, update on public.home_highlights to authenticated;
create policy "public reads highlights" on public.home_highlights for select to anon, authenticated using (true);
create policy "admins insert highlights" on public.home_highlights for insert to authenticated with check (exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "admins update highlights" on public.home_highlights for update to authenticated using (exists(select 1 from public.admin_users where user_id=auth.uid())) with check (exists(select 1 from public.admin_users where user_id=auth.uid()));

alter table public.store_settings add column if not exists business_hours text not null default 'Segunda a sexta, 08h30–12h e 14h–18h.';
alter table public.store_settings add column if not exists history_text text not null default 'A DOM COSSÉ AVIOS DE MATE surgiu da inspiração de seu fundador em conceituar o autêntico Mate Gaúcho através de avios que resgatam a história do Mate no pampa.';
drop trigger if exists catalog_sections_audit on public.catalog_sections;
create trigger catalog_sections_audit after insert or update or delete on public.catalog_sections for each row execute function private.audit_admin_change();
drop trigger if exists home_highlights_audit on public.home_highlights;
create trigger home_highlights_audit after update on public.home_highlights for each row execute function private.audit_admin_change();

commit;
