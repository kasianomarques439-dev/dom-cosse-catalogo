
export type DomSection = { id: string; category: 'cuias' | 'bombas'; title: string; short_label: string; position: number; is_visible: boolean };
export type DomProduct = { id: string; section_id: string | null; category: string; name: string; measure: string | null; description: string; image_url: string | null; position: number; is_published: boolean };
export type DomHighlight = { slot: number; image_url: string | null; alt_text: string; title: string; link_url: string | null };
export type DomSettings = { whatsapp: string; instagram: string; email: string; address: string; city: string; state: string; business_hours: string; history_text: string; banner_url: string | null; banner_mobile_url: string | null };

export const ORIGINAL_SECTIONS: DomSection[] = [
  ['cuias','CUIA BAGO DE TORO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA*','Bago Virola Alpaca'],
  ['cuias','CUIA BAGO DE TORO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA PÉ DE METAL*','Bago Virola Alpaca Pé de Metal'],
  ['cuias','CUIA BAGO DE TORO TRADICIONAL PORONGO FERRO *VIROLA EM ALPACA COM CICATRIZ*','Bago Virola Alpaca com Cicatriz'],
  ['cuias','CUIA BAGO DE TORO PREMIUM *BOCAL EM ALPACA*','Bago Premium Bocal Alpaca'],
  ['cuias','CUIA BAGO DE TORO PREMIUM *BOCAL EM ALPACA COM CICATRIZ*','Bago Premium Bocal Alpaca com Cicatriz'],
  ['cuias','CUIA BAGO DE TORO COM VIROLA EM ALPACA *MADEIRA DE LEI*','Bago Madeira de Lei'],
  ['cuias','CUIA MÉDIA PORONGO FERRO BOCAL E PÉ DE METAL','Cuia Média Porongo Ferro'],
  ['bombas','BOMBAS EM ALPACA ARTESANAIS *(FEITA A MÃO)*','Bombas em Alpaca Artesanais'],
  ['bombas','BOMBA INOX TORCIDA','Bomba Inox Torcida'],
].map(([category,title,short_label], index) => ({ id: `original-${index + 1}`, category: category as DomSection['category'], title, short_label, position: index, is_visible: true }));

export const DEFAULT_DOM_SETTINGS: DomSettings = {
  whatsapp: '(51) 98231-5818', instagram: '@domcosse', email: 'contato@domcosse.com.br',
  address: 'Rua José Bonifácio, 328, sala 312, Centro', city: 'Ijuí', state: 'RS',
  business_hours: 'Segunda a sexta, 08h30–12h e 14h–18h.',
  history_text: 'A DOM COSSÉ AVIOS DE MATE surgiu da inspiração de seu fundador em conceituar o autêntico Mate Gaúcho através de avios que resgatam a história do Mate no pampa.',
  banner_url: null, banner_mobile_url: null,
};

export const CATEGORY_PHOTOS = { cuias: '/images/categorias/referencia-cuias.png', bombas: '/images/categorias/referencia-bombas.jpg' };

const PREVIOUS_CATEGORY_PHOTOS = { cuias: '/images/categorias/cuias.png', bombas: '/images/categorias/bombas.png' };
export function resolveCategoryPhotos(rows: { slug: string; image_url: string | null }[]) {
  const photos: Record<string, string> = { ...CATEGORY_PHOTOS };
  for (const row of rows) {
    if (row.slug !== 'cuias' && row.slug !== 'bombas') continue;
    if (row.image_url && row.image_url !== PREVIOUS_CATEGORY_PHOTOS[row.slug]) photos[row.slug] = row.image_url;
  }
  return photos;
}

export function splitSectionTitle(title: string) {
  const match = title.match(/^(.*?)\s*\*([^*]+)\*\s*(.*)$/);
  return match ? { base: `${match[1]} ${match[3]}`.trim(), pill: match[2].trim() } : { base: title.replaceAll('*', '').trim(), pill: '' };
}

export function sectionAnchor(section: DomSection) { return `secao-${section.id}`; }
export function instagramLabel(value: string) { try { const url = new URL(value); if (['instagram.com','www.instagram.com'].includes(url.hostname)) return `@${url.pathname.split('/').filter(Boolean)[0] || 'domcosse'}`; } catch {} return value.startsWith('@') ? value : `@${value || 'domcosse'}`; }
export function whatsappHref(number: string, name?: string) {
  const digits = number.replace(/\D/g, '');
  const normalized = digits.length < 10 ? '5551982315818' : digits.startsWith('55') ? digits : `55${digits}`;
  const message = name ? `Olá! Vim pelo site da Dom Cossé e gostaria de pedir o produto ${name}.` : 'Olá! Vim pelo site da Dom Cossé e gostaria de fazer um pedido.';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
