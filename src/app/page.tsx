import { createClient } from '@/lib/supabase/server';
import type { Product, StoreSettings } from '@/lib/types';
import Catalog from '@/components/catalog';
export const revalidate = 0;
export default async function Home() {
  let products: Product[] = []; let settings: StoreSettings = { whatsapp: '', instagram: '' };
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try { const supabase = await createClient(); const [p,s] = await Promise.all([supabase.from('products').select('*').order('created_at',{ascending:false}).limit(100),supabase.from('store_settings').select('whatsapp,instagram').eq('id',true).maybeSingle()]); products=p.data??[]; settings=s.data??settings; } catch {}
  }
  return <Catalog initialProducts={products} settings={settings}/>;
}
