alter table public.store_settings
  add column if not exists company_name text not null default 'José Maria Representações Limitada',
  add column if not exists email text not null default 'josemaria.sul@gmail.com',
  add column if not exists address text not null default 'Rua José Bonifácio, 328, sala 312, Centro',
  add column if not exists city text not null default 'Ijuí',
  add column if not exists state text not null default 'RS',
  add column if not exists postal_code text not null default '98700-262';

-- Preenche apenas os contatos vazios; mantém qualquer valor previamente cadastrado.
update public.store_settings
set whatsapp = case when btrim(whatsapp) = '' then '(55) 99122-5365' else whatsapp end,
    instagram = case when btrim(instagram) = '' then 'https://www.instagram.com/domcosse/' else instagram end,
    updated_at = now()
where id = true
  and (btrim(whatsapp) = '' or btrim(instagram) = '');
