import 'server-only';
import { createHash } from 'crypto';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type LimiterClient = {
  rpc: (name: string, args: { p_scope: string; p_subject_hash: string; p_limit: number; p_window_seconds: number }) => Promise<{ data: boolean | null; error: unknown }>;
};
let limiterClient: LimiterClient | null = null;
const localAttempts = new Map<string, { count: number; resetAt: number }>();

function developmentLimit(key: string, limit: number, windowSeconds: number) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json({error:'Proteção temporariamente indisponível.'},{status:503});
  const now = Date.now();
  if (localAttempts.size > 1000) for (const [subject, entry] of localAttempts) if (entry.resetAt <= now) localAttempts.delete(subject);
  const previous = localAttempts.get(key);
  const entry = previous && previous.resetAt > now ? previous : { count: 0, resetAt: now + windowSeconds * 1000 };
  if (entry.count >= limit) return NextResponse.json({error:'Muitas tentativas. Tente novamente em instantes.'},{status:429,headers:{'Retry-After':String(Math.max(1,Math.ceil((entry.resetAt-now)/1000)))}});
  entry.count++;
  localAttempts.set(key, entry);
  return null;
}

function getLimiterClient() {
  if (limiterClient) return limiterClient;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === '[SENSITIVE]') return null;
  limiterClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) as unknown as LimiterClient;
  return limiterClient;
}

export async function enforceLimit(scope:string,identity:string,limit=30,windowSeconds=60){
  const client=getLimiterClient();
  const hash=createHash('sha256').update(identity).digest('hex');const key=`domcosse:${scope}:${hash}`;
  if(!client)return developmentLimit(key,limit,windowSeconds);
  try{const {data, error}=await client.rpc('consume_rate_limit',{p_scope:scope,p_subject_hash:key,p_limit:limit,p_window_seconds:windowSeconds});if(error||typeof data!=='boolean')throw new Error('limiter');if(!data)return NextResponse.json({error:'Muitas tentativas. Tente novamente em instantes.'},{status:429,headers:{'Retry-After':String(windowSeconds)}});return null;}catch{return developmentLimit(key,limit,windowSeconds);}
}
export function trustedClientIp(request:Request){
  const raw=request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'';
  const ip=raw.trim();return isIP(ip)?ip:null;
}
export async function enforceIpLimit(request:Request,scope:string,limit:number,windowSeconds:number){
  const ip=trustedClientIp(request);
  if(!ip)return process.env.NODE_ENV==='production'?NextResponse.json({error:'Proteção temporariamente indisponível.'},{status:503}):null;
  return enforceLimit(`${scope}-ip`,ip,limit,windowSeconds);
}
