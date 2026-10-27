import { NextResponse } from 'next/server';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { settingsSchema } from '@/lib/validation';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
export async function GET(req:Request) {
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'settings-read',60,60);if(limitedIp)return limitedIp;
  const limitedUser=await enforceLimit('settings-read-user',auth.user.id,60,60);if(limitedUser)return limitedUser;
  const { data, error } = await auth.supabase.from('store_settings').select('whatsapp, instagram').eq('id', true).single();
  if (error) return NextResponse.json({ error: 'Falha ao carregar configurações.' }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function PUT(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'settings-write',30,60);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('settings-write',auth.user.id,15);if(limited)return limited;
  const body=await readJsonLimited(req,4096);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed = settingsSchema.safeParse(body.value); if (!parsed.success) return NextResponse.json({ error: 'Confira as configurações.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('store_settings').update(parsed.data).eq('id', true).select().single();
  if (error) return NextResponse.json({ error: 'Não foi possível salvar.' }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
