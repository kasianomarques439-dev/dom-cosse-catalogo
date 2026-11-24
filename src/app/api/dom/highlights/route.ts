import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { refreshCatalog } from '@/lib/dom-cache';
import { supabaseUrl } from '@/lib/supabase/env';
const image = z.url().refine(value => {try{const url=new URL(value);return !!supabaseUrl&&url.origin===new URL(supabaseUrl).origin&&url.pathname.startsWith('/storage/v1/object/public/product-images/');}catch{return false;}});
const destination = z.union([z.string().regex(/^\/(?!\/)[^\s]*$/), z.url().refine(value => value.startsWith('https://'))]);
const schema = z.array(z.object({slot:z.number().int().min(1).max(12),image_url:image.nullable(),alt_text:z.string().max(160),title:z.string().trim().max(120),link_url:destination.nullable()}).strict()).min(1).max(12).refine(rows => new Set(rows.map(row => row.slot)).size === rows.length);
export async function GET(){const auth=await requireAdmin();if('error' in auth)return auth.error;const{data,error}=await auth.supabase.from('home_highlights').select('*').order('slot');return error?NextResponse.json({error:'Falha ao carregar destaques.'},{status:500}):NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}});}
export async function PUT(req:Request){
  if(!originAllowed(req))return NextResponse.json({error:'Origem inválida.'},{status:403});
  const auth=await requireAdmin();if('error' in auth)return auth.error;
  const ip=await enforceIpLimit(req,'highlights-write',20,60);if(ip)return ip;
  const limit=await enforceLimit('highlights-write',auth.user.id,15,60);if(limit)return limit;
  const body=await readJsonLimited(req,16384);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed=schema.safeParse(body.value);if(!parsed.success)return NextResponse.json({error:'Confira os destaques.'},{status:400});
  const {error}=await auth.supabase.from('home_highlights').upsert(parsed.data,{onConflict:'slot'});
  if(error)return NextResponse.json({error:'Não foi possível publicar os destaques.'},{status:500});
  refreshCatalog();return NextResponse.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});
}
