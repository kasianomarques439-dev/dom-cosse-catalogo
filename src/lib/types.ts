export type CategoryIcon = 'cuia' | 'bomba' | 'shapes';
export type Category = { slug: string; name: string; icon: CategoryIcon; image_url?: string | null; position?: number; created_at?: string; updated_at?: string };
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { slug: 'cuias', name: 'Cuias', icon: 'cuia', image_url: '/images/categorias/cuias.png' },
  { slug: 'bombas', name: 'Bombas', icon: 'bomba', image_url: '/images/categorias/bombas.png' },
  { slug: 'lotes-de-cuias', name: 'Lotes de Cuias', icon: 'cuia', image_url: '/images/categorias/lotes-de-cuias.png' },
];
export function sortCategories(items: Category[]): Category[] {
  const rank: Record<string, number> = { cuias: 0, bombas: 1, 'lotes-de-cuias': 2 };
  return [...items].sort((a, b) =>
    (rank[a.slug] ?? 2) - (rank[b.slug] ?? 2) || a.name.localeCompare(b.name, 'pt-BR'));
}
export const CUIA_SUBCATEGORY_VALUES = [
  'bago_virola_alpaca_4mm',
  'bago_virola_alpaca_6mm',
  'bago_virola_alpaca_10mm',
  'bago_virola_alpaca_15mm',
  'bago_virola_alpaca_25mm',
  'bago_bocal_alpaca_10mm',
  'bago_bocal_alpaca_15mm',
  'bago_bocal_alpaca_25mm',
] as const;
export type CuiaSubcategory = typeof CUIA_SUBCATEGORY_VALUES[number];
export const CUIA_SUBCATEGORIES: readonly { value: CuiaSubcategory; label: string }[] = [
  { value: 'bago_virola_alpaca_4mm', label: 'CUIA BAGO VIROLA ALPACA 4mm' },
  { value: 'bago_virola_alpaca_6mm', label: 'CUIA BAGO VIROLA ALPACA 6mm' },
  { value: 'bago_virola_alpaca_10mm', label: 'CUIA BAGO VIROLA ALPACA 10mm' },
  { value: 'bago_virola_alpaca_15mm', label: 'CUIA BAGO VIROLA ALPACA 15mm' },
  { value: 'bago_virola_alpaca_25mm', label: 'CUIA BAGO VIROLA ALPACA 25mm' },
  { value: 'bago_bocal_alpaca_10mm', label: 'CUIA BAGO BOCAL ALPACA 10mm' },
  { value: 'bago_bocal_alpaca_15mm', label: 'CUIA BAGO BOCAL ALPACA 15mm' },
  { value: 'bago_bocal_alpaca_25mm', label: 'CUIA BAGO BOCAL ALPACA 25mm' },
];
export type ProductStatus = 'disponivel' | 'esgotado';
export type LotQuantity = 6 | 12 | 24 | 36 | 48;
export const LOT_QUANTITIES: readonly LotQuantity[] = [6, 12, 24, 36, 48];
export type Product = { id: string; name: string; description: string; price: number | null; category: string; section_id?: string | null; measure?: string | null; position?: number; cuia_subcategory: CuiaSubcategory | null; lot_quantity: LotQuantity | null; is_featured: boolean; featured_order: number; is_published: boolean; status: ProductStatus; image_url: string | null; gallery_urls: string[]; created_at: string; updated_at: string };
export type StoreSettings = {
  whatsapp: string;
  instagram: string;
  company_name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  banner_url: string | null;
  banner_mobile_url: string | null;
  banner_desktop_x: number;
  banner_desktop_y: number;
  banner_mobile_x: number;
  banner_mobile_y: number;
  banner_cta_x: number;
  banner_cta_y: number;
  banner_mobile_cta_x: number;
  banner_mobile_cta_y: number;
};
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsapp: '+55 51 98231-5818',
  instagram: 'https://www.instagram.com/domcosse/',
  company_name: 'Dom Cossé — Avios de Mate',
  email: 'josemaria.sul@gmail.com',
  address: 'Rua José Bonifácio, 328, sala 312 — Centro',
  city: 'Ijuí',
  state: 'RS',
  postal_code: '98700-262',
  banner_url: null,
  banner_mobile_url: null,
  banner_desktop_x: 50,
  banner_desktop_y: 50,
  banner_mobile_x: 50,
  banner_mobile_y: 50,
  banner_cta_x: 50,
  banner_cta_y: 85,
  banner_mobile_cta_x: 50,
  banner_mobile_cta_y: 85,
};
