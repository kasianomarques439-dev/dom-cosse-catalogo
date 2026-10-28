-- Stores the editable public catalog banner in the existing public image bucket.
alter table public.store_settings
  drop constraint if exists store_settings_banner_url_check;

alter table public.store_settings
  add column if not exists banner_url text;

alter table public.store_settings
  add constraint store_settings_banner_url_check
  check (
    banner_url is null or (
      banner_url like 'https://%/storage/v1/object/public/product-images/%'
    )
  );
