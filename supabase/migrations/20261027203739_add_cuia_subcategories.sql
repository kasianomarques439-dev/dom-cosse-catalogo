alter table public.products
  add column if not exists cuia_subcategory text;

alter table public.products
  drop constraint if exists products_cuia_subcategory_check;

alter table public.products
  add constraint products_cuia_subcategory_check check (
    (category = 'cuias' and (cuia_subcategory is null or cuia_subcategory in (
      'bago_virola_aplaca_4mm',
      'bago_virola_alpaca_6mm',
      'bago_virola_aplaca_10mm',
      'bago_virola_alpaca_15mm',
      'bago_virola_aplaca_25mm',
      'bago_bocal_aplaca_10mm',
      'bago_bocal_alpaca_15mm',
      'bago_bocal_aplaca_25mm'
    ))) or (category = 'bombas' and cuia_subcategory is null)
  );

create index if not exists products_cuia_subcategory_idx
  on public.products(cuia_subcategory)
  where cuia_subcategory is not null;
