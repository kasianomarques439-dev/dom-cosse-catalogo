import { NextResponse } from 'next/server';
import { categoryCreateSchema } from '@/lib/validation';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { refreshCatalog } from '@/lib/dom-cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'categories-read', 90, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('categories-read-user', auth.user.id, 90, 60);
  if (userLimit) return userLimit;
  const { data, error } = await auth.supabase.from('categories').select('*').order('position').order('name');
  if (error) return NextResponse.json({ error: 'Falha ao carregar categorias.' }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'categories-write', 40, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('categories-write', auth.user.id, 20, 60);
  if (userLimit) return userLimit;
  const body = await readJsonLimited(req, 4096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const parsed = categoryCreateSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: 'Confira nome, slug e ordem da categoria.' }, { status: 400 });

  const slug = parsed.data.slug || parsed.data.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48).replace(/-$/g, '');
  if (!slug) return NextResponse.json({ error: 'O nome não gera um identificador válido.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('categories')
    .insert({ ...parsed.data, slug }).select('*').single();
  if (error?.code === '23505') return NextResponse.json({ error: 'Já existe uma categoria com esse identificador. Escolha outro nome.' }, { status: 409 });
  if (error) return NextResponse.json({ error: 'Não foi possível criar a categoria.' }, { status: 500 });
  refreshCatalog();
  return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
