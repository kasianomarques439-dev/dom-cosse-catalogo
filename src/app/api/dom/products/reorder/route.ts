import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { refreshCatalog } from '../../sections/route';

const schema = z.object({ first: z.uuid(), second: z.uuid() }).strict().refine(value => value.first !== value.second);

export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'products-reorder', 60, 60); if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('products-reorder', auth.user.id, 60, 60); if (userLimit) return userLimit;
  const body = await readJsonLimited(req, 512); if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const parsed = schema.safeParse(body.value); if (!parsed.success) return NextResponse.json({ error: 'Produtos inválidos.' }, { status: 400 });
  const { error } = await auth.supabase.rpc('swap_catalog_products', { p_first: parsed.data.first, p_second: parsed.data.second });
  if (error) return NextResponse.json({ error: 'Não foi possível reordenar os produtos.' }, { status: 400 });
  refreshCatalog();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
