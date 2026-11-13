-- Add mobile artwork and independent framing/click target positions to the existing banner settings.
alter table public.store_settings
  add column if not exists banner_mobile_url text,
  add column if not exists banner_desktop_x integer not null default 50,
  add column if not exists banner_desktop_y integer not null default 50,
  add column if not exists banner_mobile_x integer not null default 50,
  add column if not exists banner_mobile_y integer not null default 50,
  add column if not exists banner_cta_x integer not null default 50,
  add column if not exists banner_cta_y integer not null default 85,
  add column if not exists banner_mobile_cta_x integer not null default 50,
  add column if not exists banner_mobile_cta_y integer not null default 85;

alter table public.store_settings
  add constraint store_settings_banner_mobile_url_check
    check (banner_mobile_url is null or banner_mobile_url like 'https://%/storage/v1/object/public/product-images/%'),
  add constraint store_settings_banner_positions_check
    check (
      banner_desktop_x between 0 and 100 and banner_desktop_y between 0 and 100 and
      banner_mobile_x between 0 and 100 and banner_mobile_y between 0 and 100 and
      banner_cta_x between 0 and 100 and banner_cta_y between 0 and 100 and
      banner_mobile_cta_x between 0 and 100 and banner_mobile_cta_y between 0 and 100
    );
