import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
export async function POST(req:Request){
  if(!originAllowed(req))return NextResponse.json({error:'Origem inválida.'},{status:403});
  const body=await readJsonLimited(req,2048);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const password=(body.value as {password?:unknown})?.password;
  if(typeof password!=='string'||password.length<12||password.length>1024)return NextResponse.json({error:'Use uma senha de pelo menos 12 caracteres.'},{status:400});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:'Link de recuperação inválido ou expirado.'},{status:401});
  const limitedIp=await enforceIpLimit(req,'reset',10,3600);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('reset-user',user.id,5,3600);if(limited)return limited;
  const{error}=await supabase.auth.updateUser({password});if(error)return NextResponse.json({error:'Não foi possível redefinir a senha.'},{status:400});
  return NextResponse.json({ok:true});
}
