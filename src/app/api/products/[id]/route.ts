import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { productSchema } from '@/lib/validation';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
const idSchema = z.string().uuid();
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'products-write',60,60);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('products-write',auth.user.id);if(limited)return limited;
  const { id } = await ctx.params; if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 });
  const body=await readJsonLimited(req,16384);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed = productSchema.safeParse(body.value); if (!parsed.success) return NextResponse.json({ error: 'Confira os campos do produto.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('products').update(parsed.data).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar o produto.' }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'products-write',60,60);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('products-write',auth.user.id);if(limited)return limited;
  const { id } = await ctx.params; if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 });
  const { error } = await auth.supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o produto.' }, { status: 500 });
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } });
}
