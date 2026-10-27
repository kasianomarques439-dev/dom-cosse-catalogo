import 'server-only';
import { createHash } from 'crypto';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
export async function enforceLimit(scope:string,identity:string,limit=30,windowSeconds=60){
  const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url||!token){if(process.env.NODE_ENV!=='production')return null;return NextResponse.json({error:'Proteção temporariamente indisponível.'},{status:503});}
  const hash=createHash('sha256').update(identity).digest('hex');const key=`domcosse:${scope}:${hash}`;
  try{const response=await fetch(`${url.replace(/\/$/,'')}/pipeline`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify([['INCR',key],['EXPIRE',key,windowSeconds]]),cache:'no-store',signal:AbortSignal.timeout(2500)});if(!response.ok)throw new Error('limiter');const result=await response.json() as Array<{result?:number;error?:string}>;if(!Array.isArray(result)||result.length!==2||result.some(item=>item.error)||!Number.isFinite(Number(result[0]?.result)))throw new Error('limiter');const count=Number(result[0].result);if(count>limit)return NextResponse.json({error:'Muitas tentativas. Tente novamente em instantes.'},{status:429,headers:{'Retry-After':String(windowSeconds)}});return null}catch{return process.env.NODE_ENV==='production'?NextResponse.json({error:'Proteção temporariamente indisponível.'},{status:503}):null;}
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
