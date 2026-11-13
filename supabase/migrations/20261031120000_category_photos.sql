alter table public.categories add column if not exists image_url text;

update public.categories
set image_url = case slug
  when 'cuias' then '/images/categorias/cuias.png'
  when 'bombas' then '/images/categorias/bombas.png'
  when 'lotes-de-cuias' then '/images/categorias/lotes-de-cuias.png'
  else image_url
end
where image_url is null;
