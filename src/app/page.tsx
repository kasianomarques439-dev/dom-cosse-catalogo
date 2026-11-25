import DomHome from '@/components/dom-home';
import { getDomData } from '@/lib/dom-server-data';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Dom Cossé Avios de Mate | Cuias e bombas para lojistas',
  description: 'Cuias Bago de Touro em Porongo Ferro, com virola em alpaca, e bombas artesanais em alpaca. Atendimento para lojistas com horário agendado.',
  alternates: { canonical: '/' },
  openGraph: { url: '/', images: [{ url: '/banners/banner-desktop.jpg', width: 1674, height: 940, alt: 'Dom Cossé Avios de Mate ao pôr do sol' }] },
};
export default async function Home() { const { featured, settings, culture } = await getDomData(); return <DomHome featured={featured} settings={settings} culture={culture}/>; }
