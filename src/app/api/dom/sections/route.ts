import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';

export const sectionSchema = z.object({ category: z.enum(['cuias','bombas']), title: z.string().trim().min(1).max(180), short_label: z.string().trim().min(1).max(100), position: z.number().int().min(0).max(9999), is_visible: z.boolean() }).strict();
export function refreshCatalog() { for (const path of ['/','/catalogo','/catalogo/cuias','/catalogo/bombas','/nossa-historia','/contato']) revalidatePath(path); }
export async function GET() {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase.from('catalog_sections').select('*').order('position');
  return error ? NextResponse.json({ error: 'Falha ao carregar seções.' }, { status: 500 }) : NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const ip = await enforceIpLimit(req,'sections-write',40,60); if(ip)return ip;
  const limit = await enforceLimit('sections-write',auth.user.id,30,60); if(limit)return limit;
  const body = await readJsonLimited(req,4096); if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed = sectionSchema.safeParse(body.value); if(!parsed.success)return NextResponse.json({error:'Confira os campos da seção.'},{status:400});
  const { data, error } = await auth.supabase.from('catalog_sections').insert(parsed.data).select('*').single();
  if(error)return NextResponse.json({error:'Não foi possível salvar a seção.'},{status:500});
  refreshCatalog(); return NextResponse.json(data,{status:201,headers:{'Cache-Control':'private, no-store'}});
}
