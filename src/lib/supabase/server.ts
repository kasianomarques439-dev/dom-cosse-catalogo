import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublicKey, supabaseUrl } from '@/lib/supabase/env';
export async function createClient() {
  const jar = await cookies();
  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: { getAll: () => jar.getAll(), setAll: (values) => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {} } },
  });
}
