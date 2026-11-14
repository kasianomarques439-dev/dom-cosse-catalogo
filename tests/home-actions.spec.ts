import { expect, test } from '@playwright/test';

for (const width of [360, 390, 768, 1366, 1920]) {
  test(`ações da capa em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    const catalog = page.getByRole('link', { name: /VER CATÁLOGO/i });
    const whatsapp = page.getByRole('link', { name: /PEDIR NO WHATSAPP/i }).first();
    await expect(catalog).toHaveAttribute('href', '/catalogo');
    await expect(whatsapp).toHaveAttribute('href', /wa\.me/);
    await expect.poll(() => catalog.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('dc-cta-shine');
    await expect.poll(() => whatsapp.evaluate(el => getComputedStyle(el).animationName)).toBe('dc-cta-pulse');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('ações respeitam movimento reduzido e mantêm foco visível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const catalog = page.getByRole('link', { name: /VER CATÁLOGO/i });
  const whatsapp = page.getByRole('link', { name: /PEDIR NO WHATSAPP/i }).first();
  expect(await catalog.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
  expect(await whatsapp.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await catalog.focus();
  expect(await catalog.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
});
