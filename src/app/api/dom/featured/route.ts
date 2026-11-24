import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceIpLimit, enforceLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { supabaseUrl } from '@/lib/supabase/env';
import { featuredListSchema, MAX_DESTAQUES } from '@/lib/dom-featured';
import { refreshCatalog } from '@/lib/dom-cache';

const imageUrl = z.string().min(1).max(1000).refine(value => {
  if (value === '/images/highlight-placeholder.svg') return true;
  try {
    const url = new URL(value);
    return !!supabaseUrl && url.origin === new URL(supabaseUrl).origin && url.pathname.startsWith('/storage/v1/object/public/product-images/');
  } catch { return false; }
});
const trustedListSchema = featuredListSchema.refine(items => items.every(item => imageUrl.safeParse(item.image_url).success));

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase.from('home_featured_products').select('*').order('position');
  if (error) return NextResponse.json({ error: 'Falha ao carregar destaques.' }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'featured-write', 20, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('featured-write', auth.user.id, 15, 60);
  if (userLimit) return userLimit;
  const body = await readJsonLimited(req, 48 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const parsed = trustedListSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: `Confira os destaques (máximo de ${MAX_DESTAQUES}).` }, { status: 400 });
  const { error } = parsed.data.length ? await auth.supabase.from('home_featured_products').upsert(parsed.data, { onConflict: 'id' }) : { error: null };
  if (error) return NextResponse.json({ error: 'Não foi possível salvar os destaques.' }, { status: 500 });
  refreshCatalog();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Destaque inválido.' }, { status: 400 });
  const ipLimit = await enforceIpLimit(req, 'featured-delete', 20, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('featured-delete', auth.user.id, 15, 60);
  if (userLimit) return userLimit;
  const { error } = await auth.supabase.from('home_featured_products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o destaque.' }, { status: 500 });
  refreshCatalog();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
