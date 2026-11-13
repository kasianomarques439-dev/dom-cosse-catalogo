import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import './dom.css';
import './dom-admin.css';
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'], display: 'swap' });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['500', '600'], style: ['italic'], display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL('https://domcosse.com.br'),
  title: 'Dom Cossé — O autêntico mate gaúcho | Avios de Mate',
  description: 'O autêntico mate gaúcho. Catálogo de cuias, bombas e lotes da Dom Cossé. Veja fotos, detalhes e disponibilidade e consulte pelo WhatsApp.',
  openGraph: { title: 'Dom Cossé — O autêntico mate gaúcho | Avios de Mate', description: 'O autêntico mate gaúcho. Cuias, bombas e lotes da Dom Cossé. Conheça nosso catálogo.', url: '/', locale: 'pt_BR', type: 'website', images: [{ url: '/dom-cosse-logo-badge.png', width: 1254, height: 1254, alt: 'Logomarca Dom Cossé — Avios de Mate. O autêntico mate gaúcho.' }] },
  twitter: { card: 'summary', title: 'Dom Cossé — O autêntico mate gaúcho | Avios de Mate', description: 'O autêntico mate gaúcho. Cuias, bombas e lotes da Dom Cossé.', images: ['/dom-cosse-logo-badge.png'] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffdfa', colorScheme: 'light' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="pt-BR" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}><body>{children}</body></html>;
}
