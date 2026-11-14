import { test, expect } from '@playwright/test';
import { productSchema, settingsSchema } from '../src/lib/validation';

const widths = [320, 360, 375, 390, 414, 430, 480, 768, 1024, 1366, 1920];
for (const width of widths) {
  test(`site atual sem rolagem horizontal em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.locator('.dc-hero-photo img')).toBeVisible();
    await expect(page.locator('.dc-home-category')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.goto('/catalogo/cuias');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('banner usa as fotos enviadas sem cortar as cuias e mantém os links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('/');
  await expect(page.locator('.dc-hero-photo source')).toHaveAttribute('srcset', '/banners/dom-cosse-hero-desktop.jpg');
  await expect(page.locator('.dc-hero-photo img')).toHaveAttribute('src', '/banners/dom-cosse-hero-mobile.jpg');
  await expect(page.locator('.dc-hero-photo img')).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('.dc-home-cta-catalog')).toHaveAttribute('href', '/catalogo');
  await expect(page.locator('.dc-home-cta-whatsapp')).toHaveAttribute('href', /wa\.me/);
  await expect(page.locator('.dc-hero h1')).toHaveText('DOM COSSÉAVIOS DE MATE');
  await expect(page.locator('.dc-hero p')).toHaveText('O autêntico mate gaúcho.');
  for (const width of [360, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(page.locator('.dc-hero-photo img')).toHaveCSS('object-fit', 'contain');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test('admin protegido e validação de produto', async ({ page, request }) => {
  await expect(await request.get('/robots.txt')).toBeOK();
  await expect(await request.get('/sitemap.xml')).toBeOK();
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel('E-mail')).toBeVisible();
  expect(productSchema.safeParse({ name: 'Cuia', description: '', price: null, category: 'cuias', status: 'disponivel' }).success).toBe(true);
  expect(productSchema.safeParse({ name: '', description: '', price: null, category: 'cuias', status: 'disponivel' }).success).toBe(false);
  const settings = settingsSchema.parse({ whatsapp: '+55 51 98231-5818', instagram: '@domcosse', company_name: 'Dom Cossé', email: 'contato@example.com', address: 'Rua Central, 1', city: 'Ijuí', state: 'RS', postal_code: '98700-000' });
  expect(settings.instagram).toBe('https://www.instagram.com/domcosse/');
});
