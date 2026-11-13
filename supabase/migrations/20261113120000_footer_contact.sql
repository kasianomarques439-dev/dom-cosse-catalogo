begin;

-- Endereço público solicitado para o rodapé e a página de contato.
update public.store_settings
set email = 'josemaria.sul@gmail.com',
    address = 'Rua José Bonifácio, 328, Sala 312 – Centro',
    city = 'Ijuí',
    state = 'RS',
    postal_code = '98700-000'
where id = true;

commit;
