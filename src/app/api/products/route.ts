import { NextResponse } from 'next/server';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { productSchema } from '@/lib/validation';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';

export async function GET(req:Request) {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'products-read',90,60);if(limitedIp)return limitedIp;
  const limitedUser=await enforceLimit('products-read-user',auth.user.id,90,60);if(limitedUser)return limitedUser;
  const { data, error } = await auth.supabase.from('products').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: 'Falha ao carregar produtos.' }, { status: 500, headers: { 'Cache-Control': 'private, no-store' } });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'products-write',60,60);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('products-write',auth.user.id);if(limited)return limited;
  const body=await readJsonLimited(req,16384);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed = productSchema.safeParse(body.value); if (!parsed.success) return NextResponse.json({ error: 'Confira os campos do produto.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('products').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: 'Não foi possível salvar o produto.' }, { status: 500 });
  return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
