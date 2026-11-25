import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_SETTINGS, type Product, type StoreSettings } from '@/lib/types';
import ProductDetail from '@/components/product-detail';
import { correctBagoNomenclature } from '@/lib/dom-data';

export const revalidate = 0;
const origin = 'https://domcosse.com.br';
type Props = { params: Promise<{ id: string }> };

async function getProduct(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('*').eq('id', id).eq('is_published', true).maybeSingle();
  return error ? null : data as Product | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Produto não encontrado | Dom Cossé', robots: { index: false, follow: false } };
  const name = correctBagoNomenclature(product.name);
  const description = correctBagoNomenclature(product.description?.trim() || `${name} no catálogo Dom Cossé — Avios de Mate. Consulte fotos, disponibilidade e detalhes pelo WhatsApp.`);
  const canonical = `${origin}/produtos/${product.id}`;
  return {
    title: `${name} | Dom Cossé`, description,
    alternates: { canonical },
    openGraph: { title: `${name} | Dom Cossé`, description, url: canonical, type: 'website', images: product.image_url ? [{ url: product.image_url, alt: name }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const supabase = await createClient();
  const [settingsResult, categoryResult] = await Promise.all([
    supabase.from('store_settings').select('*').eq('id', true).maybeSingle(),
    supabase.from('categories').select('slug,name').eq('slug', product.category).maybeSingle(),
  ]);
  const settings = { ...DEFAULT_STORE_SETTINGS, ...(settingsResult.data || {}) } as StoreSettings;
  const categoryName = categoryResult.data?.name || DEFAULT_CATEGORIES.find((item) => item.slug === product.category)?.name || product.category;
  const canonical = `${origin}/produtos/${product.id}`;
  const photos = [...new Set([...(product.image_url ? [product.image_url] : []), ...(product.gallery_urls || [])])];
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'Product', name: correctBagoNomenclature(product.name),
    description: product.description ? correctBagoNomenclature(product.description) : undefined, image: photos.length ? photos : undefined,
    identifier: product.id, category: categoryName,
    brand: { '@type': 'Brand', name: 'Dom Cossé' },
    offers: product.price === null ? undefined : {
      '@type': 'Offer', url: canonical, priceCurrency: 'BRL', price: Number(product.price).toFixed(2),
      availability: product.status === 'disponivel' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}/><ProductDetail product={product} categoryName={categoryName} whatsapp={settings.whatsapp}/></>;
}
