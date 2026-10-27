export type Category = 'cuias' | 'bombas';
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
export type Product = { id: string; name: string; description: string; price: number; category: Category; cuia_subcategory: CuiaSubcategory | null; status: ProductStatus; image_url: string | null; created_at: string; updated_at: string };
export type StoreSettings = { whatsapp: string; instagram: string };
