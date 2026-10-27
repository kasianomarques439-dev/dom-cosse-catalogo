import { z } from 'zod';
import { CUIA_SUBCATEGORY_VALUES } from '@/lib/types';
const imageUrl=z.url().refine(value=>{try{const base=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!base)return false;const url=new URL(value);return url.protocol==='https:'&&url.origin===new URL(base).origin&&url.pathname.startsWith('/storage/v1/object/public/product-images/')}catch{return false}},'Use uma imagem enviada pelo painel.');
export const productSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).default(''), price: z.number().finite().min(0).max(99999999), category: z.enum(['cuias','bombas']), cuia_subcategory: z.enum(CUIA_SUBCATEGORY_VALUES).nullable().optional(), status: z.enum(['disponivel','esgotado']), image_url: imageUrl.nullable().optional() }).strict().refine(product => product.category === 'cuias' || !product.cuia_subcategory, { message: 'Bombas não possuem subcategoria de cuia.', path: ['cuia_subcategory'] });
export const settingsSchema = z.object({
  whatsapp: z.string().trim().regex(/^(?:\+?[0-9\s()-]{10,30})?$/,'Número inválido.').refine(v=>!v||v.replace(/\D/g,'').length>=10&&v.replace(/\D/g,'').length<=15,'Número inválido.'),
  instagram: z.string().trim().max(200).refine(v=>!v||/^@?[a-zA-Z0-9._]{1,30}$/.test(v)||(()=>{try{const url=new URL(v);return url.protocol==='https:'&&['instagram.com','www.instagram.com'].includes(url.hostname)}catch{return false}})(),'Informe o perfil ou uma URL HTTPS do Instagram.').transform(v=>!v||v.startsWith('https://')?v:`https://www.instagram.com/${v.replace(/^@/,'')}/`),
  company_name: z.string().trim().max(160),
  email: z.union([z.literal(''),z.email().max(200)]),
  address: z.string().trim().max(200),
  city: z.string().trim().max(100),
  state: z.string().trim().max(2),
  postal_code: z.string().trim().max(16),
}).strict();
