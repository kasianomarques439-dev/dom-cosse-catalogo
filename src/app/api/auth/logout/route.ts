import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { originAllowed } from '@/lib/admin';
export async function POST(req:Request) { if(!originAllowed(req))return NextResponse.json({error:'Origem inválida.'},{status:403}); const supabase=await createClient(); await supabase.auth.signOut(); return NextResponse.json({ok:true}); }
