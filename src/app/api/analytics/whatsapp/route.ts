import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { originAllowed } from '@/lib/admin';
import { enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { WHATSAPP_PLACEMENTS } from '@/lib/whatsapp-events';

const eventSchema = z.object({
  page_path: z.string().min(1).max(200).regex(/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/),
  category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(48).nullable(),
  product_id: z.uuid().nullable(),
  placement: z.enum(WHATSAPP_PLACEMENTS),
}).strict();

export async function POST(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const limited = await enforceIpLimit(request, 'whatsapp-click', 120, 60);
  if (limited) return limited;
  const body = await readJsonLimited(request, 1024);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const parsed = eventSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { error } = await supabase.from('whatsapp_click_events').insert(parsed.data);
  if (error) return NextResponse.json({ error: 'Não foi possível registrar o clique.' }, { status: 503 });
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
