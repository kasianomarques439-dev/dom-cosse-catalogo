import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin, originAllowed } from '@/lib/admin';
import { enforceLimit, enforceIpLimit } from '@/lib/rate-limit';
import { readJsonLimited } from '@/lib/request';
import { supabaseUrl } from '@/lib/supabase/env';
import { matchesImageSignature } from '@/lib/image-upload';
import sharp from 'sharp';
const MAX = 10 * 1024 * 1024;
export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin(); if ('error' in auth) return auth.error;
  const limitedIp=await enforceIpLimit(req,'image-upload',60,300);if(limitedIp)return limitedIp;
  const limited=await enforceLimit('image-upload',auth.user.id,60,300);if(limited)return limited;
  const declared=Number(req.headers.get('content-length')??0);if(declared>MAX+256*1024)return NextResponse.json({error:'A imagem deve ter até 10 MB.'},{status:413});
  if(!req.headers.get('content-type')?.toLowerCase().includes('multipart/form-data'))return NextResponse.json({error:'Envio inválido.'},{status:415});
  if(!req.body)return NextResponse.json({error:'Selecione uma imagem.'},{status:400});
  const reader=req.body.getReader();const chunks:Uint8Array[]=[];let total=0;try{while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX+256*1024){await reader.cancel();return NextResponse.json({error:'A imagem deve ter até 10 MB.'},{status:413});}chunks.push(value);}}catch{return NextResponse.json({error:'Envio inválido.'},{status:400});}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const form = await new Request(req.url,{method:'POST',headers:req.headers,body:bytes}).formData().catch(() => null); const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Selecione uma imagem.' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'A imagem deve ter até 10 MB.' }, { status: 413 });
  const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const contentType = file.type.toLowerCase();
  const ext = types[contentType]; if (!ext) return NextResponse.json({ error: 'Use JPG, PNG ou WEBP. Fotos HEIC são convertidas antes do envio.' }, { status: 415 });
  const head=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(!matchesImageSignature(contentType,head))return NextResponse.json({error:'O arquivo não é uma imagem válida. Selecione uma foto original da galeria.'},{status:415});
  const base = `${auth.user.id}/${randomUUID()}`;
  const source = Buffer.from(await file.arrayBuffer());
  const highlight = form?.get('purpose') === 'highlight';
  let variants: { path: string; bytes: Buffer }[];
  try {
    const sizes = highlight ? [800] : [1600,800,400];
    variants = await Promise.all(sizes.map(async width => ({
      path: `${base}${width === 1600 ? '' : `-${width}`}.webp`,
      bytes: await sharp(source, { limitInputPixels: 40_000_000 }).rotate().resize({ width, height: width, fit: highlight ? 'cover' : 'inside', withoutEnlargement: !highlight, position: 'attention' }).webp({ quality: 84 }).toBuffer(),
    })));
  } catch { return NextResponse.json({ error: 'Não foi possível processar a imagem.' }, { status: 415 }); }
  const uploaded: string[] = [];
  for (const variant of variants) {
    const { error } = await auth.supabase.storage.from('product-images').upload(variant.path, variant.bytes, { contentType: 'image/webp', upsert: false });
    if (error) { if(uploaded.length)await auth.supabase.storage.from('product-images').remove(uploaded); return NextResponse.json({ error: 'Falha no envio da imagem.' }, { status: 500 }); }
    uploaded.push(variant.path);
  }
  const urls = uploaded.map(path => auth.supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
  return NextResponse.json({ url: urls[0], sizes: highlight ? { medium: urls[0], small: urls[0] } : { medium: urls[1], small: urls[2] } }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const ipLimit = await enforceIpLimit(req, 'image-delete', 40, 60);
  if (ipLimit) return ipLimit;
  const userLimit = await enforceLimit('image-delete', auth.user.id, 30, 60);
  if (userLimit) return userLimit;
  const body = await readJsonLimited(req, 16384);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const value = body.value as { url?: unknown; urls?: unknown };
  const imageUrls = Array.isArray(value?.urls) ? value.urls : [value?.url];
  if (!supabaseUrl || imageUrls.length < 1 || imageUrls.length > 48 || imageUrls.some((url) => typeof url !== 'string')) return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
  const prefix = '/storage/v1/object/public/product-images/';
  const storageOrigin = new URL(supabaseUrl).origin;
  const objectPaths: string[] = [];
  for (const imageUrl of imageUrls as string[]) {
    let parsedUrl: URL;
    try { parsedUrl = new URL(imageUrl); } catch { return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 }); }
    if (parsedUrl.origin !== storageOrigin || !parsedUrl.pathname.startsWith(prefix)) return NextResponse.json({ error: 'A imagem não pertence ao armazenamento autorizado.' }, { status: 403 });
    const objectPath = parsedUrl.pathname.slice(prefix.length);
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}(?:-(?:400|800))?\.(?:jpg|png|webp)$/i.test(objectPath)) return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
    objectPaths.push(objectPath);
  }
  const { error } = await auth.supabase.storage.from('product-images').remove([...new Set(objectPaths)]);
  if (error) return NextResponse.json({ error: 'Não foi possível remover a fotografia.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
