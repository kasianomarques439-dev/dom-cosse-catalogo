import { NextResponse } from 'next/server';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { refreshCatalog } from '@/lib/dom-cache';
import { sectionSchema } from '@/lib/dom-sections';

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
  if(error?.code==='23505')return NextResponse.json({error:'Já existe uma seção com esse título nesta categoria.'},{status:409});
  if(error?.code==='23503')return NextResponse.json({error:'Selecione uma categoria existente.'},{status:400});
  if(error)return NextResponse.json({error:'Não foi possível salvar a seção.'},{status:500});
  refreshCatalog(); return NextResponse.json(data,{status:201,headers:{'Cache-Control':'private, no-store'}});
}
