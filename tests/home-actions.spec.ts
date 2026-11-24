import { expect, test } from '@playwright/test';

for (const [width, height, expected] of [[390, 844, 'banner-mobile'], [768, 1024, 'banner-mobile'], [1440, 900, 'banner-desktop']] as const) {
  test(`capa e área do WhatsApp em ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const picture = page.locator('.dc-cover picture img');
    const hotspot = page.locator('.dc-cover-hotspot');
    await expect(picture).toHaveAttribute('alt', /Dom Cossé Avios de Mate/);
    await expect(hotspot).toHaveAttribute('aria-label', 'Fale conosco pelo WhatsApp');
    await expect(hotspot).toHaveAttribute('href', /wa\.me\/5551982315818\?text=/);
    expect(await picture.evaluate(image => (image as HTMLImageElement).currentSrc)).toContain(expected);
    const bounds = await hotspot.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(await page.locator('main a[href^="/catalogo"]').count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('menu da home leva às seções e respeita movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Destaques' })).toHaveAttribute('href', '#destaques');
  await expect(page.getByRole('heading', { name: 'Destaques da loja' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nossas Linhas' })).toBeVisible();
  const contact = page.locator('.dc-cover-hotspot');
  await contact.focus();
  expect(await contact.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
});
