import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(req:NextRequest){
  const code=req.nextUrl.searchParams.get('code');const type=req.nextUrl.searchParams.get('type');
  const base=process.env.NEXT_PUBLIC_SITE_URL;if(!base)return NextResponse.json({error:'Configuração indisponível.'},{status:503});
  if(!code)return NextResponse.redirect(new URL('/admin/login',base));
  const supabase=await createClient();const{error}=await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error?'/admin/login':type==='recovery'?'/admin/reset':'/admin',base));
}
