begin;

alter table public.categories add column if not exists position integer not null default 0;
update public.categories set position = case slug when 'cuias' then 0 when 'bombas' then 1 else 2 end
where position = 0 and slug <> 'cuias';
create index if not exists categories_position_idx on public.categories(position, name);

create unique index if not exists catalog_sections_category_title_unique
on public.catalog_sections (category, lower(btrim(title)));

commit;
