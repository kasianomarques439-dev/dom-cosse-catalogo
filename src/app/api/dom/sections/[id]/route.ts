import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { sectionSchema } from '@/lib/dom-sections';
import { refreshCatalog } from '@/lib/dom-cache';
const idSchema = z.uuid();
type Context = { params: Promise<{ id: string }> };
async function guard(req: Request, ctx: Context) {
  if (!originAllowed(req)) return { error: NextResponse.json({ error: 'Origem inválida.' }, { status: 403 }) };
  const auth = await requireAdmin(); if ('error' in auth) return {error:auth.error};
  const ip = await enforceIpLimit(req,'sections-write',40,60); if(ip)return {error:ip};
  const limit = await enforceLimit('sections-write',auth.user.id,30,60); if(limit)return {error:limit};
  const {id} = await ctx.params; if(!idSchema.safeParse(id).success)return {error:NextResponse.json({error:'Seção inválida.'},{status:400})};
  return {auth,id};
}
export async function PATCH(req: Request, ctx: Context) {
  const checked = await guard(req,ctx); if('error' in checked)return checked.error;
  const body = await readJsonLimited(req,4096); if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed = sectionSchema.safeParse(body.value); if(!parsed.success)return NextResponse.json({error:'Confira os campos da seção.'},{status:400});
  const existing=await checked.auth.supabase.from('catalog_sections').select('category').eq('id',checked.id).single();
  if(existing.error)return NextResponse.json({error:'Seção não encontrada.'},{status:404});
  if(existing.data.category!==parsed.data.category){const linked=await checked.auth.supabase.from('products').select('id',{count:'exact',head:true}).eq('section_id',checked.id);if(linked.error)return NextResponse.json({error:'Não foi possível conferir os produtos.'},{status:500});if(linked.count)return NextResponse.json({error:'Mova os produtos antes de trocar a categoria da seção.'},{status:409});}
  const {data,error}=await checked.auth.supabase.from('catalog_sections').update(parsed.data).eq('id',checked.id).select('*').single();
  if(error?.code==='23505')return NextResponse.json({error:'Já existe uma seção com esse título nesta categoria.'},{status:409});
  if(error?.code==='23503')return NextResponse.json({error:'Selecione uma categoria existente.'},{status:400});
  if(error)return NextResponse.json({error:'Não foi possível atualizar a seção.'},{status:500});
  refreshCatalog();return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}});
}
export async function DELETE(req: Request, ctx: Context) {
  const checked = await guard(req,ctx); if('error' in checked)return checked.error;
  const {error}=await checked.auth.supabase.from('catalog_sections').delete().eq('id',checked.id);
  if(error)return NextResponse.json({error:'Não foi possível excluir a seção.'},{status:500});
  refreshCatalog();return new NextResponse(null,{status:204});
}
