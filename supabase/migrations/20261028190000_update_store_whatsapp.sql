-- Update only the previous default contact; preserve a number configured by the owner.
update public.store_settings
set whatsapp = '+55 51 98231-5818', updated_at = now()
where id = true and btrim(whatsapp) in ('(55) 99122-5365', '');
