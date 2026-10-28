import { NextResponse } from 'next/server';
import { z } from 'zod';
import { categorySchema } from '@/lib/validation';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(48);

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'categories-write', 40, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('categories-write', auth.user.id, 20, 60);
  if (userLimit) return userLimit;
  const { slug } = await ctx.params;
  if (!slugSchema.safeParse(slug).success) return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
  const body = await readJsonLimited(req, 4096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const parsed = categorySchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: 'Informe um nome e um ícone válidos.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('categories').update(parsed.data).eq('slug', slug).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar a categoria.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'categories-write', 40, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('categories-write', auth.user.id, 20, 60);
  if (userLimit) return userLimit;
  const { slug } = await ctx.params;
  if (!slugSchema.safeParse(slug).success) return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('categories').delete().eq('slug', slug).select('slug').maybeSingle();
  if (error?.code === '23503') return NextResponse.json({ error: 'A categoria ainda tem produtos. Reatribua esses produtos antes de excluí-la.' }, { status: 409 });
  if (error) return NextResponse.json({ error: 'Não foi possível excluir a categoria.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } });
}
