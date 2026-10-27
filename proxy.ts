import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function proxy(request: NextRequest) {
  const nonce=randomBytes(16).toString('base64');
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseOrigin="'self'";
  try { if(supabaseUrl){const u=new URL(supabaseUrl);supabaseOrigin=u.origin;} } catch {}
  const csp=[
    "default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,"style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseOrigin}`,"font-src 'self' data:",`connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^https:/,'wss:')}`,
    "object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'","upgrade-insecure-requests"
  ].join('; ');
  const requestHeaders=new Headers(request.headers);requestHeaders.set('x-nonce',nonce);requestHeaders.set('Content-Security-Policy',csp);
  let response=NextResponse.next({request:{headers:requestHeaders}});
  if(supabaseUrl&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY){
    const supabase=createServerClient(supabaseUrl,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));requestHeaders.set('Cookie',request.cookies.toString());response=NextResponse.next({request:{headers:requestHeaders}});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
    await supabase.auth.getUser();
  }
  response.headers.set('Content-Security-Policy',csp);
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Cross-Origin-Opener-Policy','same-origin');
  if(process.env.NODE_ENV==='production')response.headers.set('Strict-Transport-Security','max-age=31536000');
  if(request.nextUrl.pathname.startsWith('/admin')||request.nextUrl.pathname.startsWith('/api'))response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:[{'source':'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'}]};
