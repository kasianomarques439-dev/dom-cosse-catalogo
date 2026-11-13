import { expect, test } from '@playwright/test';

test('capa reserva espaço e botões sociais permanecem fixos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const before = await page.locator('.dc-hero').boundingBox();
  const beforeHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.mouse.wheel(0, 600);
  const after = await page.locator('.dc-hero').boundingBox();
  const afterHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs((before?.height ?? 0) - (after?.height ?? 0))).toBeLessThanOrEqual(1);
  expect(afterHeight).toBe(beforeHeight);
  await expect(page.locator('.dc-float-links')).toHaveCSS('position', 'fixed');
});

test('seções vazias não geram cards nem links de rodapé', async ({ page }) => {
  await page.goto('/catalogo/cuias');
  await expect(page.locator('.dc-product-section')).toHaveCount(0);
  await expect(page.locator('.dc-product-card')).toHaveCount(0);
  await expect(page.locator('.dc-footer-columns a')).toHaveCount(0);
});
