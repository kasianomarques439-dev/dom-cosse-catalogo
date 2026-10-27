export type Category = 'cuias' | 'bombas';
export type ProductStatus = 'disponivel' | 'esgotado';
export type Product = { id: string; name: string; description: string; price: number; category: Category; status: ProductStatus; image_url: string | null; created_at: string; updated_at: string };
export type StoreSettings = { whatsapp: string; instagram: string };
