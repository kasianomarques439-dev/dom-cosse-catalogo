import { notFound } from 'next/navigation';
import DomPublic from '@/components/dom-public';
import { getDomData } from '@/lib/dom-server-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { categories } = await getDomData();
  const category = categories.find(item => item.slug === slug);
  return { title: category ? `${category.name} | Dom Cossé Avios de Mate` : 'Categoria não encontrada' };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getDomData();
  if (!data.categories.some(item => item.slug === slug)) notFound();
  return <DomPublic page="category" categorySlug={slug} {...data}/>;
}
