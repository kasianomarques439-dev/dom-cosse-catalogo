alter table public.products
  drop constraint if exists products_cuia_subcategory_check;

update public.products
set cuia_subcategory = case cuia_subcategory
  when 'bago_virola_aplaca_4mm' then 'bago_virola_alpaca_4mm'
  when 'bago_virola_aplaca_10mm' then 'bago_virola_alpaca_10mm'
  when 'bago_virola_aplaca_25mm' then 'bago_virola_alpaca_25mm'
  when 'bago_bocal_aplaca_10mm' then 'bago_bocal_alpaca_10mm'
  when 'bago_bocal_aplaca_25mm' then 'bago_bocal_alpaca_25mm'
  else cuia_subcategory
end
where cuia_subcategory in (
  'bago_virola_aplaca_4mm',
  'bago_virola_aplaca_10mm',
  'bago_virola_aplaca_25mm',
  'bago_bocal_aplaca_10mm',
  'bago_bocal_aplaca_25mm'
);

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
    ))) or (category = 'bombas' and cuia_subcategory is null)
  );
