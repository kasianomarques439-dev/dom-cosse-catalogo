import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabasePublicKey, supabaseUrl } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';
const origin = 'https://domcosse.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = ['','/catalogo','/catalogo/cuias','/catalogo/bombas','/nossa-historia','/contato'].map((path,index)=>({ url: `${origin}${path}`, changeFrequency: 'weekly', priority: index === 0 ? 1 : .7 }));
  if (!hasSupabaseConfig) return entries;
  const supabase = createClient(supabaseUrl, supabasePublicKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  for (let offset = 0; offset < 10000; offset += 1000) {
    const { data, error } = await supabase.from('products').select('id,updated_at').eq('is_published', true).order('created_at', { ascending: false }).range(offset, offset + 999);
    if (error || !data) break;
    entries.push(...data.map((product) => ({ url: `${origin}/produtos/${product.id}`, lastModified: product.updated_at ? new Date(product.updated_at) : undefined, changeFrequency: 'weekly' as const, priority: .7 })));
    if (data.length < 1000) break;
  }
  return entries;
}
