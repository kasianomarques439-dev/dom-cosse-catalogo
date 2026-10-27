import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Dom Cossé – Avios de Mate', description: 'Catálogo Dom Cossé – Avios de Mate', robots: { index: true, follow: true } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffdfa', colorScheme: 'light' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>; }
