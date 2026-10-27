import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
export async function POST(req:Request) {
  if(!originAllowed(req))return NextResponse.json({error:'Origem inválida.'},{status:403});
  const body=await readJsonLimited(req,2048); if(!body.ok)return NextResponse.json({message:'Se houver uma conta para esse e-mail, você receberá as instruções.'}); const email=typeof (body.value as {email?:unknown})?.email==='string'?(body.value as {email:string}).email.trim().slice(0,254):'';
  const limitedIp=await enforceIpLimit(req,'recovery',12,3600);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('recovery-email',email.toLocaleLowerCase('en-US')||'invalid-email',4,3600);if(limited)return limited;
  if(!email||!email.includes('@'))return NextResponse.json({message:'Se houver uma conta para esse e-mail, você receberá as instruções.'});
  const base=process.env.NEXT_PUBLIC_SITE_URL; if(!base)return NextResponse.json({message:'Se houver uma conta para esse e-mail, você receberá as instruções.'});
  const supabase=await createClient(); await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${new URL(base).origin}/auth/callback?type=recovery`});
  return NextResponse.json({message:'Se houver uma conta para esse e-mail, você receberá as instruções.'});
}
