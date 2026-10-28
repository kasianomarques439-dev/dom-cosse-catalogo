import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { supabaseUrl } from '@/lib/supabase/env';
const MAX = 5 * 1024 * 1024;
export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'image-upload',30,60);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('image-upload',auth.user.id,20);if(limited)return limited;
  const declared=Number(req.headers.get('content-length')??0);if(declared>MAX+256*1024)return NextResponse.json({error:'A imagem deve ter até 5 MB.'},{status:413});
  if(!req.headers.get('content-type')?.toLowerCase().includes('multipart/form-data'))return NextResponse.json({error:'Envio inválido.'},{status:415});
  if(!req.body)return NextResponse.json({error:'Selecione uma imagem.'},{status:400});
  const reader=req.body.getReader();const chunks:Uint8Array[]=[];let total=0;try{while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX+256*1024){await reader.cancel();return NextResponse.json({error:'A imagem deve ter até 5 MB.'},{status:413});}chunks.push(value);}}catch{return NextResponse.json({error:'Envio inválido.'},{status:400});}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const form = await new Request(req.url,{method:'POST',headers:req.headers,body:bytes}).formData().catch(() => null); const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Selecione uma imagem.' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'A imagem deve ter até 5 MB.' }, { status: 413 });
  const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = types[file.type]; if (!ext) return NextResponse.json({ error: 'Use JPG, PNG ou WEBP.' }, { status: 415 });
  const head=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const jpeg=head[0]===0xff&&head[1]===0xd8&&head[2]===0xff;
  const png=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((byte,index)=>head[index]===byte);
  const webp=String.fromCharCode(...head.slice(0,4))==='RIFF'&&String.fromCharCode(...head.slice(8,12))==='WEBP';
  if(!(file.type==='image/jpeg'&&jpeg||file.type==='image/png'&&png||file.type==='image/webp'&&webp))return NextResponse.json({error:'O arquivo não é uma imagem válida.'},{status:415});
  const path = `${auth.user.id}/${randomUUID()}.${ext}`;
  const { error } = await auth.supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: 'Falha no envio da imagem.' }, { status: 500 });
  const { data } = auth.supabase.storage.from('product-images').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'image-delete', 40, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('image-delete', auth.user.id, 30, 60);
  if (userLimit) return userLimit;
  const body = await readJsonLimited(req, 4096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const imageUrl = (body.value as { url?: unknown })?.url;
  if (typeof imageUrl !== 'string' || !supabaseUrl) return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
  let parsedUrl: URL;
  try { parsedUrl = new URL(imageUrl); } catch { return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 }); }
  const prefix = '/storage/v1/object/public/product-images/';
  if (parsedUrl.origin !== new URL(supabaseUrl).origin || !parsedUrl.pathname.startsWith(prefix)) {
    return NextResponse.json({ error: 'A imagem não pertence ao armazenamento autorizado.' }, { status: 403 });
  }
  const objectPath = parsedUrl.pathname.slice('/storage/v1/object/public/product-images/'.length);
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(objectPath)) return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
  const { error } = await auth.supabase.storage.from('product-images').remove([objectPath]);
  if (error) return NextResponse.json({ error: 'Não foi possível remover a fotografia.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
