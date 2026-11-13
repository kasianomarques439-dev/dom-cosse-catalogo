import { expect, test } from '@playwright/test';
import { categoryPatchSchema } from '../src/lib/validation';

test('editar nome e ordem preserva a foto da categoria', () => {
  const parsed = categoryPatchSchema.parse({ name: 'Cuias', slug: 'cuias', position: 0 });
  expect(parsed).not.toHaveProperty('image_url');
  expect(categoryPatchSchema.safeParse({ position: -1 }).success).toBe(false);
});
