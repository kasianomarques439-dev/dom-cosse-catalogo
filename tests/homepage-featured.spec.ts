import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { featuredListSchema, MAX_DESTAQUES } from '@/lib/dom-featured';
import { matchesImageSignature } from '@/lib/image-upload';

function feature(index: number, type: 'cuia' | 'bomba' = 'cuia') {
  return { id: randomUUID(), type, name: `Destaque ${index + 1}`, description: 'Peça artesanal para lojistas.', image_url: 'https://example.supabase.co/storage/v1/object/public/product-images/test.jpg', badge: null, position: index, is_active: true };
}

test('mantém o limite de dez e aceita mistura livre de tipos', () => {
  expect(MAX_DESTAQUES).toBe(10);
  const rows = Array.from({ length: 10 }, (_, index) => feature(index, index < 6 ? 'cuia' : 'bomba'));
  expect(featuredListSchema.safeParse(rows).success).toBe(true);
  expect(featuredListSchema.safeParse([...rows, feature(10)]).success).toBe(false);
});

test('valida campos e posições únicas dos destaques', () => {
  const rows = Array.from({ length: 2 }, (_, index) => feature(index));
  expect(featuredListSchema.safeParse(rows).success).toBe(true);
  expect(featuredListSchema.safeParse([{ ...rows[0], name: 'x'.repeat(61) }]).success).toBe(false);
  expect(featuredListSchema.safeParse([{ ...rows[0], description: 'x'.repeat(141) }]).success).toBe(false);
  expect(featuredListSchema.safeParse([rows[0], { ...rows[1], position: rows[0].position }]).success).toBe(false);
});

test('confere assinatura real em vez de confiar na extensão ou MIME declarado', () => {
  expect(matchesImageSignature('image/png', Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))).toBe(true);
  expect(matchesImageSignature('image/jpeg', Uint8Array.from([0xff,0xd8,0xff,0x00]))).toBe(true);
  expect(matchesImageSignature('image/webp', Uint8Array.from([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]))).toBe(true);
  expect(matchesImageSignature('image/png', Uint8Array.from([0xff,0xd8,0xff,0x00]))).toBe(false);
  expect(matchesImageSignature('image/svg+xml', new Uint8Array(12))).toBe(false);
});

test('não disponibiliza a API de destaques sem sessão administrativa', async ({ request }) => {
  const response = await request.get('/api/dom/featured');
  expect(response.status()).not.toBe(200);
});
