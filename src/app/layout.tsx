import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import './dom.css';
import './dom-overrides.css';
import './dom-home.css';
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'], display: 'swap' });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['500', '600'], style: ['italic'], display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL('https://domcosse.com.br'),
  title: 'Dom Cossé Avios de Mate | Cuias e bombas para lojistas',
  description: 'Cuias Bago de Toro em Porongo Ferro, com virola em alpaca, e bombas artesanais em alpaca. Atendimento para lojistas com horário agendado.',
  openGraph: { title: 'Dom Cossé Avios de Mate | Atendimento a lojistas', description: 'Cuias em Porongo Ferro e bombas artesanais em alpaca. Conheça os destaques e fale com a Dom Cossé.', url: '/', locale: 'pt_BR', type: 'website', images: [{ url: '/banners/banner-desktop.jpg', width: 1674, height: 940, alt: 'Dom Cossé Avios de Mate ao pôr do sol' }] },
  twitter: { card: 'summary_large_image', title: 'Dom Cossé Avios de Mate | Atendimento a lojistas', description: 'Cuias em Porongo Ferro e bombas artesanais em alpaca.', images: ['/banners/banner-desktop.jpg'] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffdfa', colorScheme: 'light' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="pt-BR" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}><body>{children}</body></html>;
}
