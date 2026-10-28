import { createClient } from '@/lib/supabase/server';
import type { Category, Product } from '@/lib/types';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_SETTINGS, sortCategories } from '@/lib/types';
import Catalog from '@/components/catalog';
import { hasSupabaseConfig } from '@/lib/supabase/env';

export const revalidate = 0;

export default async function Home() {
  let products: Product[] = [];
  let categories: Category[] = [...DEFAULT_CATEGORIES];
  let settings = DEFAULT_STORE_SETTINGS;

  if (hasSupabaseConfig) {
    try {
      const supabase = await createClient();
      const [productResult, settingsResult, categoryResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('store_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (!productResult.error && productResult.data) products = productResult.data as Product[];
      if (!settingsResult.error && settingsResult.data) settings = { ...DEFAULT_STORE_SETTINGS, ...settingsResult.data };
      if (!categoryResult.error && categoryResult.data?.length) categories = sortCategories(categoryResult.data as Category[]);
    } catch {
      // Render the local catalog shell when Supabase is not configured yet.
    }
  }

  return <Catalog initialProducts={products} initialCategories={categories} settings={settings}/>;
}
