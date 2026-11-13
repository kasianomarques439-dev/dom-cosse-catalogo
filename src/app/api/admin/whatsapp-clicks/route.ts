import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase.from('whatsapp_click_events').select('id', { count: 'exact', head: true }).gte('occurred_at', since);
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os cliques.' }, { status: 503 });
  return NextResponse.json({ count: count ?? 0 }, { headers: { 'Cache-Control': 'private, no-store' } });
}
