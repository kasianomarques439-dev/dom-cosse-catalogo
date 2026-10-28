import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import '@fontsource/roboto-condensed/latin-400.css';
import '@fontsource/roboto-condensed/latin-500.css';
import '@fontsource/roboto-condensed/latin-600.css';
import '@fontsource/roboto-condensed/latin-700.css';
import '@fontsource/roboto-condensed/latin-800.css';
import '@fontsource/bodoni-moda/latin-700.css';
import '@fontsource/bodoni-moda/latin-800.css';
import './globals.css';
export const metadata: Metadata = { title: 'Dom Cossé – Avios de Mate', description: 'Catálogo Dom Cossé – Avios de Mate', robots: { index: true, follow: true } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffdfa', colorScheme: 'light' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
