import { test, expect } from '@playwright/test';
import { productSchema, settingsSchema } from '../src/lib/validation';

const widths = [320, 360, 375, 390, 414, 430, 480, 768, 1024, 1366, 1920];
for (const width of widths) {
  test(`site sem rolagem horizontal em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.locator('.dc-cover picture img')).toBeVisible();
    await expect(page.locator('.dc-feature-card')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.goto('/catalogo/cuias');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('capa, contatos e acessibilidade do atalho', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('/');
  await expect(page.locator('.dc-cover-hotspot')).toHaveAttribute('href', /wa\.me\/5551982315818/);
  await expect(page.locator('.dc-home-nav a')).toHaveCount(4);
  await expect(page.locator('.dc-feature-card')).toHaveCount(6);
  await expect(page.locator('main a[href^="/catalogo"]')).toHaveCount(0);
  await expect(page.locator('.dc-home-float')).toHaveCSS('position', 'fixed');
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https:\/\/domcosse\.com\.br\/?$/);
});

test('admin protegido, metadata e validação de produto e contatos', async ({ page, request }) => {
  await expect(await request.get('/robots.txt')).toBeOK();
  await expect(await request.get('/sitemap.xml')).toBeOK();
  await page.goto('/admin/login');
  await expect(page.getByLabel('E-mail')).toBeVisible();
  expect(productSchema.safeParse({ name: 'Cuia', description: '', price: null, category: 'cuias', status: 'disponivel' }).success).toBe(true);
  expect(productSchema.safeParse({ name: '', description: '', price: null, category: 'cuias', status: 'disponivel' }).success).toBe(false);
  const settings = settingsSchema.parse({ whatsapp: '+55 51 98231-5818', whatsapp_secondary: '+55 55 3317-3112', instagram: '@domcosse', company_name: 'Dom Cossé', email: 'contato@example.com', address: 'Rua Central, 1', city: 'Ijuí', state: 'RS', postal_code: '98700-000' });
  expect(settings.instagram).toBe('https://www.instagram.com/domcosse/');
  expect(settings.banner_mobile_cta_left).toBe(12.4);
});
