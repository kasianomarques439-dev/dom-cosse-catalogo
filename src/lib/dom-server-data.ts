import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseConfig } from '@/lib/supabase/env';
import { CATEGORY_PHOTOS, DEFAULT_DOM_CATEGORIES, DEFAULT_DOM_SETTINGS, ORIGINAL_SECTIONS, resolveCategoryPhotos, sortDomCategories, type DomHighlight, type DomProduct, type DomSection } from './dom-data';
import type { Category } from './types';

export async function getDomData() {
  const fallback = { sections: ORIGINAL_SECTIONS, products: [] as DomProduct[], highlights: [1,2,3].map(slot => ({ slot, image_url: null, alt_text: '', title: '', link_url: null })) as DomHighlight[], settings: DEFAULT_DOM_SETTINGS, photos: CATEGORY_PHOTOS, categories: DEFAULT_DOM_CATEGORIES };
  if (!hasSupabaseConfig) return fallback;
  try {
    const db = await createClient();
    const [sections, products, highlights, settings, categories] = await Promise.all([
      db.from('catalog_sections').select('*').order('position'),
      db.from('products').select('id,section_id,category,name,measure,description,image_url,position,is_published').eq('is_published', true).order('position'),
      db.from('home_highlights').select('slot,image_url,alt_text,title,link_url').order('slot'),
      db.from('store_settings').select('whatsapp,instagram,email,address,city,state,postal_code,business_hours,history_text,banner_url,banner_mobile_url').eq('id', true).maybeSingle(),
      db.from('categories').select('*'),
    ]);
    return {
      sections: sections.error ? fallback.sections : (sections.data as DomSection[]),
      products: products.error ? fallback.products : (products.data as DomProduct[]),
      highlights: highlights.error || !highlights.data?.length ? fallback.highlights : (highlights.data as DomHighlight[]),
      settings: settings.error ? fallback.settings : { ...DEFAULT_DOM_SETTINGS, ...(settings.data || {}) },
      photos: resolveCategoryPhotos(categories.data || []),
      categories: categories.error ? fallback.categories : sortDomCategories(categories.data as Category[]),
    };
  } catch { return fallback; }
}
