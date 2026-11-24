import { z } from 'zod';
import { CUIA_SUBCATEGORY_VALUES, LOT_QUANTITIES } from '@/lib/types';
import { supabaseUrl } from '@/lib/supabase/env';
const imageUrl=z.url().refine(value=>{try{if(!supabaseUrl)return false;const url=new URL(value);return url.protocol==='https:'&&url.origin===new URL(supabaseUrl).origin&&url.pathname.startsWith('/storage/v1/object/public/product-images/')}catch{return false}},'Use uma imagem enviada pelo painel.');
export const productSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).default(''), price: z.number().finite().min(0).max(99999999).nullable(), category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(1).max(48), section_id: z.uuid().nullable().optional(), measure: z.enum(['4mm','6mm','10mm','15mm','25mm']).nullable().optional(), position: z.number().int().min(0).max(9999).default(0), cuia_subcategory: z.enum(CUIA_SUBCATEGORY_VALUES).nullable().optional(), lot_quantity: z.number().int().refine(value => LOT_QUANTITIES.includes(value as typeof LOT_QUANTITIES[number])).nullable().optional(), is_featured: z.boolean().default(false), featured_order: z.number().int().min(0).max(999).default(0), is_published: z.boolean().default(true), status: z.enum(['disponivel','esgotado']), image_url: imageUrl.nullable().optional(), gallery_urls: z.array(imageUrl).max(48).default([]) }).strict().refine(product => product.category === 'cuias' || !product.cuia_subcategory, { message: 'Somente Cuias podem ter subcategoria.', path: ['cuia_subcategory'] }).refine(product => product.category === 'lotes-de-cuias' ? LOT_QUANTITIES.includes(product.lot_quantity as typeof LOT_QUANTITIES[number]) : !product.lot_quantity, { message: 'Selecione a quantidade de cuias do lote.', path: ['lot_quantity'] }).refine(product => product.gallery_urls.length + (product.image_url ? 1 : 0) <= (product.category === 'lotes-de-cuias' ? 48 : 10), { message: 'Limite de fotos excedido para esta categoria.', path: ['gallery_urls'] }).refine(product => !product.section_id || !!product.image_url, { message: 'Adicione uma foto do produto.', path: ['image_url'] });
const categoryLocalImage = z.enum(['/images/categorias/cuias.png', '/images/categorias/bombas.png', '/images/categorias/lotes-de-cuias.png']);
export const categorySchema = z.object({ name: z.string().trim().min(1).max(80), icon: z.enum(['cuia','bomba','shapes']), image_url: z.union([imageUrl, categoryLocalImage]).nullable().default(null) }).strict();
const categorySlug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(48);
export const categoryCreateSchema = categorySchema.extend({ slug: categorySlug.optional(), position: z.number().int().min(0).max(9999).default(0) });
export const categoryPatchSchema = categorySchema.omit({ image_url: true }).extend({ image_url: z.union([imageUrl, categoryLocalImage]).nullable().optional(), slug: categorySlug.optional(), position: z.number().int().min(0).max(9999).optional() }).partial().strict();
export const settingsSchema = z.object({
  whatsapp: z.string().trim().regex(/^(?:\+?[0-9\s()-]{10,30})?$/,'Número inválido.').refine(v=>!v||v.replace(/\D/g,'').length>=10&&v.replace(/\D/g,'').length<=15,'Número inválido.'),
  whatsapp_secondary: z.string().trim().regex(/^\+?[0-9\s()-]{10,30}$/,'Número inválido.').refine(v=>v.replace(/\D/g,'').length>=10&&v.replace(/\D/g,'').length<=15,'Número inválido.'),
  instagram: z.string().trim().max(200).refine(v=>!v||/^@?[a-zA-Z0-9._]{1,30}$/.test(v)||(()=>{try{const url=new URL(v);return url.protocol==='https:'&&['instagram.com','www.instagram.com'].includes(url.hostname)}catch{return false}})(),'Informe o perfil ou uma URL HTTPS do Instagram.').transform(v=>!v||v.startsWith('https://')?v:`https://www.instagram.com/${v.replace(/^@/,'')}/`),
  company_name: z.string().trim().max(160),
  email: z.union([z.literal(''),z.email().max(200)]),
  address: z.string().trim().max(200),
  city: z.string().trim().max(100),
  state: z.string().trim().max(2),
  postal_code: z.string().trim().max(16),
  business_hours: z.string().trim().max(200).optional(),
  showroom_text: z.string().trim().max(1000).optional(),
  history_text: z.string().trim().max(5000).optional(),
  banner_url: imageUrl.nullable().default(null),
  banner_mobile_url: imageUrl.nullable().default(null),
  home_banner_desktop_url: imageUrl.nullable().default(null),
  home_banner_mobile_url: imageUrl.nullable().default(null),
  banner_desktop_x: z.number().int().min(0).max(100).default(50),
  banner_desktop_y: z.number().int().min(0).max(100).default(50),
  banner_mobile_x: z.number().int().min(0).max(100).default(50),
  banner_mobile_y: z.number().int().min(0).max(100).default(50),
  banner_cta_x: z.number().int().min(0).max(100).default(50),
  banner_cta_y: z.number().int().min(0).max(100).default(85),
  banner_mobile_cta_x: z.number().int().min(0).max(100).default(50),
  banner_mobile_cta_y: z.number().int().min(0).max(100).default(85),
  banner_desktop_cta_left: z.number().min(0).max(100).default(12.7),
  banner_desktop_cta_top: z.number().min(0).max(100).default(61.2),
  banner_desktop_cta_width: z.number().min(0).max(100).default(37.6),
  banner_desktop_cta_height: z.number().min(0).max(100).default(13.3),
  banner_mobile_cta_left: z.number().min(0).max(100).default(12.4),
  banner_mobile_cta_top: z.number().min(0).max(100).default(82.9),
  banner_mobile_cta_width: z.number().min(0).max(100).default(74.9),
  banner_mobile_cta_height: z.number().min(0).max(100).default(10.5),
}).strict().superRefine((value, context) => {
  for (const prefix of ['banner_desktop_cta', 'banner_mobile_cta'] as const) {
    const left = value[`${prefix}_left` as keyof typeof value] as number;
    const top = value[`${prefix}_top` as keyof typeof value] as number;
    const width = value[`${prefix}_width` as keyof typeof value] as number;
    const height = value[`${prefix}_height` as keyof typeof value] as number;
    if (left + width > 100 || top + height > 100) context.addIssue({ code: 'custom', message: 'A área clicável deve ficar dentro do banner.' });
  }
});
