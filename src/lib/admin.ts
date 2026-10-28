import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { hasSupabaseConfig } from '@/lib/supabase/env';
export async function requireAdmin(options?:{skipMfa?:boolean}) {
  if(!hasSupabaseConfig)return {error:NextResponse.json({error:'Serviço de identidade não configurado.'},{status:503})} as const;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error?.name === 'AuthSessionMissingError') return { error: NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 }) } as const;
  if (error) return { error: NextResponse.json({ error: 'Serviço de identidade indisponível.' }, { status: 503 }) } as const;
  if (!user) return { error: NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 }) } as const;
  const { data, error: roleError } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (roleError) return { error: NextResponse.json({ error: 'Não foi possível verificar a autorização.' }, { status: 503 }) } as const;
  if (!data) return { error: NextResponse.json({ error: 'Acesso administrativo não autorizado.' }, { status: 403 }) } as const;
  if (process.env.NODE_ENV === 'production' && !options?.skipMfa) {
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) return { error: NextResponse.json({ error: 'Não foi possível verificar a autenticação multifator.' }, { status: 503 }) } as const;
    if (assurance.currentLevel !== 'aal2') return { error: NextResponse.json({ error: 'Autenticação multifator obrigatória.' }, { status: 403 }) } as const;
  }
  return { supabase, user } as const;
}
export function originAllowed(request: Request) {
  const expected = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  if (!expected || !origin) return false;
  try {
    const originUrl = new URL(origin);
    const configuredOrigins = [
      new URL(expected).origin,
      'https://dom-cosse-catalogo.vercel.app',
      'https://domcosse.com.br',
      'https://www.domcosse.com.br',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '',
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : '',
    ].filter(Boolean).map((value) => new URL(value).origin);
    return configuredOrigins.includes(originUrl.origin);
  } catch { return false; }
}
