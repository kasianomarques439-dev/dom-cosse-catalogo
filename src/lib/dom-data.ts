
import type { Category } from './types';

export type DomSection = { id: string; category: string; title: string; short_label: string; position: number; is_visible: boolean };
export type DomProduct = { id: string; section_id: string | null; category: string; name: string; measure: string | null; description: string; image_url: string | null; position: number; is_published: boolean };
export type DomHighlight = { slot: number; image_url: string | null; alt_text: string; title: string; link_url: string | null };
export type DomFeature = { id: string; type: 'cuia' | 'bomba'; name: string; description: string; image_url: string; badge: string | null; position: number; is_active: boolean };
export type DomSettings = { whatsapp: string; whatsapp_secondary: string; instagram: string; email: string; address: string; city: string; state: string; postal_code: string; business_hours: string; showroom_text: string; history_text: string; banner_url: string | null; banner_mobile_url: string | null; home_banner_desktop_url: string | null; home_banner_mobile_url: string | null; banner_desktop_cta_left: number; banner_desktop_cta_top: number; banner_desktop_cta_width: number; banner_desktop_cta_height: number; banner_mobile_cta_left: number; banner_mobile_cta_top: number; banner_mobile_cta_width: number; banner_mobile_cta_height: number };

export function correctBagoNomenclature(value: string): string {
  return value.replace(/bago de toro/gi, (match) => match === match.toUpperCase() ? 'BAGO DE TOURO' : 'Bago de Touro');
}

export const ORIGINAL_SECTIONS: DomSection[] = [
  ['cuias','CUIA BAGO DE TOURO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA*','Bago Virola Alpaca'],
  ['cuias','CUIA BAGO DE TOURO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA PÉ DE METAL*','Bago Virola Alpaca Pé de Metal'],
  ['cuias','CUIA BAGO DE TOURO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA COM CICATRIZ*','Bago Virola Alpaca com Cicatriz'],
  ['cuias','CUIA BAGO DE TOURO PREMIUM *BOCAL EM ALPACA*','Bago Premium Bocal Alpaca'],
  ['cuias','CUIA BAGO DE TOURO PREMIUM *BOCAL EM ALPACA COM CICATRIZ*','Bago Premium Bocal Alpaca com Cicatriz'],
  ['cuias','CUIA BAGO DE TOURO COM VIROLA EM ALPACA *MADEIRA DE LEI*','Bago Madeira de Lei'],
  ['cuias','CUIA MÉDIA PORONGO FERRO BOCAL E PÉ DE METAL','Cuia Média Porongo Ferro'],
  ['bombas','BOMBAS EM ALPACA ARTESANAIS *(FEITA A MÃO)*','Bombas em Alpaca Artesanais'],
  ['bombas','BOMBA INOX TORCIDA','Bomba Inox Torcida'],
].map(([category,title,short_label], index) => ({ id: `original-${index + 1}`, category: category as DomSection['category'], title, short_label, position: index, is_visible: true }));

export const DEFAULT_DOM_SETTINGS: DomSettings = {
  whatsapp: '(51) 98231-5818', whatsapp_secondary: '+55 55 3317-3112', instagram: '@domcosse', email: 'josemaria.sul@gmail.com',
  address: 'Rua José Bonifácio, 328, Sala 312 – Centro', city: 'Ijuí', state: 'RS', postal_code: '98700-000',
  business_hours: 'Segunda a sexta, 08h30–12h e 14h–18h.',
  showroom_text: 'Showroom para atendimento a lojistas, com horário previamente agendado.',
  history_text: 'A DOM COSSÉ AVIOS DE MATE surgiu da inspiração de seu fundador em conceituar o autêntico Mate Gaúcho através de avios que resgatam a história do Mate no pampa.',
  banner_url: null, banner_mobile_url: null,
  home_banner_desktop_url: null, home_banner_mobile_url: null,
  banner_desktop_cta_left: 12.7, banner_desktop_cta_top: 61.2, banner_desktop_cta_width: 37.6, banner_desktop_cta_height: 13.3,
  banner_mobile_cta_left: 12.4, banner_mobile_cta_top: 82.9, banner_mobile_cta_width: 74.9, banner_mobile_cta_height: 10.5,
};

export const CATEGORY_PHOTOS = { cuias: '/images/categorias/referencia-cuias.png', bombas: '/images/categorias/referencia-bombas.jpg' };
export const DEFAULT_DOM_CATEGORIES: Category[] = [
  { slug: 'cuias', name: 'Cuias', icon: 'cuia', image_url: CATEGORY_PHOTOS.cuias, position: 0 },
  { slug: 'bombas', name: 'Bombas', icon: 'bomba', image_url: CATEGORY_PHOTOS.bombas, position: 1 },
];
export function sortDomCategories(items: Category[]) {
  const fallbackRank = (slug: string) => slug === 'cuias' ? 0 : slug === 'bombas' ? 1 : 2;
  return [...items].sort((a, b) => (a.position ?? fallbackRank(a.slug)) - (b.position ?? fallbackRank(b.slug)) || a.name.localeCompare(b.name, 'pt-BR'));
}

const PREVIOUS_CATEGORY_PHOTOS = { cuias: '/images/categorias/cuias.png', bombas: '/images/categorias/bombas.png' };
export function resolveCategoryPhotos(rows: { slug: string; image_url: string | null }[]) {
  const photos: Record<string, string> = { ...CATEGORY_PHOTOS };
  for (const row of rows) {
    if (row.slug === 'cuias' || row.slug === 'bombas') {
      if (row.image_url && row.image_url !== PREVIOUS_CATEGORY_PHOTOS[row.slug]) photos[row.slug] = row.image_url;
    } else if (row.image_url) photos[row.slug] = row.image_url;
  }
  return photos;
}

export function splitSectionTitle(title: string) {
  const match = title.match(/^(.*?)\s*\*([^*]+)\*\s*(.*)$/);
  return match ? { base: `${match[1]} ${match[3]}`.trim(), pill: match[2].trim() } : { base: title.replaceAll('*', '').trim(), pill: '' };
}

export function sectionAnchor(section: DomSection) { return `secao-${section.id}`; }
export function contactAddress(settings: DomSettings) { return `${settings.address} – ${settings.city}/${settings.state}${settings.postal_code ? ` – CEP ${settings.postal_code}` : ''}`; }
export function contactMapsHref(settings: DomSettings) {
  const street = settings.address.replace(/,?\s*sala\s*\d+\s*[–—,-]?/i, ' ').replace(/[–—,]/g, ' ').replace(/\s+/g, ' ').trim();
  const query = [street, settings.city, settings.state].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query).replace(/%20/g, '+')}`;
}
export function instagramLabel(value: string) { try { const url = new URL(value); if (['instagram.com','www.instagram.com'].includes(url.hostname)) return `@${url.pathname.split('/').filter(Boolean)[0] || 'domcosse'}`; } catch {} return value.startsWith('@') ? value : `@${value || 'domcosse'}`; }
export function contactMapsEmbedHref(settings: DomSettings) {
  const query = [settings.address, settings.city, settings.state, settings.postal_code].filter(Boolean).join(' ');
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
export function whatsappHref(number: string, name?: string) {
  const digits = number.replace(/\D/g, '');
  const normalized = digits.length < 10 ? '5551982315818' : digits.startsWith('55') ? digits : `55${digits}`;
  const message = name ? `Olá! Vim pelo site da Dom Cossé e gostaria de pedir o produto ${name}.` : 'Olá! Vim pelo site da Dom Cossé e gostaria de fazer um pedido.';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
