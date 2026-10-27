import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
export async function POST(req:Request){
  if(!originAllowed(req))return NextResponse.json({error:'Origem inválida.'},{status:403});
  const body=await readJsonLimited(req,4096);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const value=body.value as Record<string,unknown>;const email=typeof value?.email==='string'?value.email.trim().toLowerCase():'';const password=typeof value?.password==='string'?value.password:'';
  if(email.length>254||password.length>1024||!email.includes('@')||!password)return NextResponse.json({error:'Confira os dados de acesso.'},{status:400});
  const limitedIp=await enforceIpLimit(req,'login',20,900);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('login-email',email,8,900);if(limited)return limited;
  const supabase=await createClient();const{error}=await supabase.auth.signInWithPassword({email,password});
  if(error)return NextResponse.json({error:'Não foi possível entrar. Confira os dados e tente novamente.'},{status:401});
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});
}
