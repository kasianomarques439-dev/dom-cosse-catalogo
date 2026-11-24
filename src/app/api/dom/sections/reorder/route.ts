import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { refreshCatalog } from '@/lib/dom-cache';
const schema=z.object({first:z.uuid(),second:z.uuid()}).strict().refine(value=>value.first!==value.second);
export async function POST(req:Request){
  if(!originAllowed(req))return NextResponse.json({error:'Origem inválida.'},{status:403});
  const auth=await requireAdmin();if('error' in auth)return auth.error;
  const ip=await enforceIpLimit(req,'sections-order',30,60);if(ip)return ip;
  const limit=await enforceLimit('sections-order',auth.user.id,20,60);if(limit)return limit;
  const body=await readJsonLimited(req,1024);if(!body.ok)return NextResponse.json({error:body.message},{status:body.status});
  const parsed=schema.safeParse(body.value);if(!parsed.success)return NextResponse.json({error:'Seções inválidas.'},{status:400});
  const {error}=await auth.supabase.rpc('swap_catalog_sections',{p_first:parsed.data.first,p_second:parsed.data.second});
  if(error)return NextResponse.json({error:'Não foi possível alterar a ordem.'},{status:500});
  refreshCatalog();return NextResponse.json({ok:true});
}
