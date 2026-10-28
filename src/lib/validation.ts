import { z } from 'zod';
import { CUIA_SUBCATEGORY_VALUES } from '@/lib/types';
import { supabaseUrl } from '@/lib/supabase/env';
const imageUrl=z.url().refine(value=>{try{if(!supabaseUrl)return false;const url=new URL(value);return url.protocol==='https:'&&url.origin===new URL(supabaseUrl).origin&&url.pathname.startsWith('/storage/v1/object/public/product-images/')}catch{return false}},'Use uma imagem enviada pelo painel.');
export const productSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).default(''), price: z.number().finite().min(0).max(99999999), category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(1).max(48), cuia_subcategory: z.enum(CUIA_SUBCATEGORY_VALUES).nullable().optional(), status: z.enum(['disponivel','esgotado']), image_url: imageUrl.nullable().optional(), gallery_urls: z.array(imageUrl).max(10).default([]) }).strict().refine(product => product.category === 'cuias' || !product.cuia_subcategory, { message: 'Somente Cuias podem ter subcategoria.', path: ['cuia_subcategory'] }).refine(product => product.gallery_urls.length + (product.image_url ? 1 : 0) <= 10, { message: 'Use no máximo dez fotos por produto.', path: ['gallery_urls'] });
export const categorySchema = z.object({ name: z.string().trim().min(1).max(80), icon: z.enum(['cuia','bomba','shapes']) }).strict();
export const settingsSchema = z.object({
  whatsapp: z.string().trim().regex(/^(?:\+?[0-9\s()-]{10,30})?$/,'Número inválido.').refine(v=>!v||v.replace(/\D/g,'').length>=10&&v.replace(/\D/g,'').length<=15,'Número inválido.'),
  instagram: z.string().trim().max(200).refine(v=>!v||/^@?[a-zA-Z0-9._]{1,30}$/.test(v)||(()=>{try{const url=new URL(v);return url.protocol==='https:'&&['instagram.com','www.instagram.com'].includes(url.hostname)}catch{return false}})(),'Informe o perfil ou uma URL HTTPS do Instagram.').transform(v=>!v||v.startsWith('https://')?v:`https://www.instagram.com/${v.replace(/^@/,'')}/`),
  company_name: z.string().trim().max(160),
  email: z.union([z.literal(''),z.email().max(200)]),
  address: z.string().trim().max(200),
  city: z.string().trim().max(100),
  state: z.string().trim().max(2),
  postal_code: z.string().trim().max(16),
  banner_url: imageUrl.nullable().default(null),
}).strict();
