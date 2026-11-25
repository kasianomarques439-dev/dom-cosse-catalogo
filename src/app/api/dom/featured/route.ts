import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceIpLimit, enforceLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { supabaseUrl } from '@/lib/supabase/env';
import { featuredListSchema, MAX_DESTAQUES } from '@/lib/dom-featured';
import { refreshCatalog } from '@/lib/dom-cache';

const imageUrl = z.string().min(1).max(1000).refine(value => {
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
  if (error) {
    console.error('admin.home_featured_products.read', { code: error.code });
    const missingTable = error.code === 'PGRST205' || error.code === '42P01';
    const denied = error.code === '42501';
    const message = missingTable
      ? 'A tabela de destaques ainda não existe no Supabase. É necessário aplicar a migração da página inicial após confirmar o backup do banco.'
      : denied
        ? 'O usuário autenticado não tem permissão para ler os destaques. Revise a permissão de administrador no Supabase.'
        : 'Não foi possível carregar os destaques. Consulte os logs do servidor para identificar a falha no Supabase.';
    return NextResponse.json({ error: message }, { status: missingTable ? 503 : 500 });
  }
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
