import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseConfig } from '@/lib/supabase/env';
import { CATEGORY_PHOTOS, DEFAULT_DOM_CATEGORIES, DEFAULT_DOM_FEATURES, DEFAULT_DOM_SETTINGS, ORIGINAL_SECTIONS, resolveCategoryPhotos, sortDomCategories, type DomFeature, type DomHighlight, type DomProduct, type DomSection } from './dom-data';
import type { Category } from './types';

export async function getDomData() {
  const fallback = { sections: ORIGINAL_SECTIONS, products: [] as DomProduct[], highlights: Array.from({ length: 12 }, (_, index) => ({ slot: index + 1, image_url: null, alt_text: '', title: '', link_url: null })) as DomHighlight[], featured: DEFAULT_DOM_FEATURES, settings: DEFAULT_DOM_SETTINGS, photos: CATEGORY_PHOTOS, categories: DEFAULT_DOM_CATEGORIES };
  if (!hasSupabaseConfig) return fallback;
  try {
    const db = await createClient();
    const [sections, products, highlights, settings, categories, featured] = await Promise.all([
      db.from('catalog_sections').select('*').order('position'),
      db.from('products').select('id,section_id,category,name,measure,description,image_url,position,is_published').eq('is_published', true).order('position'),
      db.from('home_highlights').select('slot,image_url,alt_text,title,link_url').order('slot'),
      db.from('store_settings').select('whatsapp,whatsapp_secondary,instagram,email,address,city,state,postal_code,business_hours,showroom_text,history_text,home_banner_desktop_url,home_banner_mobile_url,banner_desktop_cta_left,banner_desktop_cta_top,banner_desktop_cta_width,banner_desktop_cta_height,banner_mobile_cta_left,banner_mobile_cta_top,banner_mobile_cta_width,banner_mobile_cta_height').eq('id', true).maybeSingle(),
      db.from('categories').select('*'),
      db.from('home_featured_products').select('id,type,name,description,image_url,badge,position,is_active').eq('is_active', true).order('position').limit(10),
    ]);
    return {
      sections: sections.error ? fallback.sections : (sections.data as DomSection[]),
      products: products.error ? fallback.products : (products.data as DomProduct[]),
      highlights: highlights.error || !highlights.data?.length ? fallback.highlights : (highlights.data as DomHighlight[]),
      featured: featured.error || !featured.data?.length ? fallback.featured : (featured.data as DomFeature[]),
      settings: settings.error ? fallback.settings : { ...DEFAULT_DOM_SETTINGS, ...(settings.data || {}) },
      photos: resolveCategoryPhotos(categories.data || []),
      categories: categories.error ? fallback.categories : sortDomCategories(categories.data as Category[]),
    };
  } catch { return fallback; }
}
