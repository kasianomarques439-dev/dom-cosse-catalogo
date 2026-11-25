import { test, expect } from '@playwright/test';

const widths = [320,375,390,430,768,1024,1440,1920];

for (const width of widths) {
  test(`home B2B sem transbordamento em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Destaques da loja' })).toHaveCount(0);
    await expect(page.locator('.dc-feature-card')).toHaveCount(0);
    await expect(page.locator('.dc-home-float-wa')).toHaveAttribute('aria-label', 'Fale conosco pelo WhatsApp');
    await expect(page.locator('.dc-home-float-ig')).toHaveAttribute('aria-label', 'Instagram @domcosse');
    await expect(page.locator('.dc-home-map')).toHaveAttribute('title', /Ijuí, RS/);
    await expect(page.locator('.dc-home-nav a')).toHaveCount(4);
    await expect(page.locator('.dc-lines details')).toHaveCount(3);
    expect(await page.locator('main a[href^="/catalogo"]').count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `artifacts/reference-home-${width}.png`, fullPage: true });
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: 'CATÁLOGO', exact: true })).toBeVisible();
    await expect(page.locator('.dc-category-tile')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `artifacts/reference-catalog-${width}.png`, fullPage: true });
  });
}

test('catálogo e navegação pública seguem acessíveis sem links na nova home', async ({ page }) => {
  await page.goto('/catalogo/cuias');
  await expect(page.getByText('Novos modelos em breve. Peça pelo WhatsApp.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pedir no WhatsApp' }).first()).toHaveAttribute('href', /wa\.me\/5551982315818/);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Nossa história' })).toBeVisible();
});

test('capas enviadas seguem nas rotas preservadas do catálogo', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('link', { name: /CUIAS/ }).locator('img')).toHaveAttribute('src', '/images/categorias/referencia-cuias.png');
  await expect(page.getByRole('link', { name: /BOMBAS/ }).locator('img')).toHaveAttribute('src', '/images/categorias/referencia-bombas.jpg');
  await page.goto('/catalogo/bombas');
  await expect(page.locator('.dc-product-card')).toHaveCount(0);
});

test('interações do catálogo continuam funcionando com movimento reduzido', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.locator('.dc-site')).toHaveClass(/dc-motion/);
  const card = page.locator('.dc-category-tile').first();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .8, box!.y + box!.height * .4);
  await expect.poll(() => card.evaluate(el => el.style.getPropertyValue('--ry'))).not.toBe('0deg');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.dc-site')).not.toHaveClass(/dc-motion/);
});

test('história e contato preservados em suas páginas próprias', async ({ page }) => {
  await page.goto('/nossa-historia');
  await expect(page.getByRole('heading', { name: 'NOSSA HISTÓRIA' })).toBeVisible();
  await expect(page.getByText(/surgiu da inspiração de seu fundador/)).toBeVisible();
  await page.goto('/contato');
  await expect(page.getByRole('heading', { name: 'FALE COM A DOM COSSÉ' })).toBeVisible();
  await expect(page.locator('.dc-contact-list a[href^="mailto:"]')).toHaveAttribute('href', /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/);
  const catalog = await page.goto('/catalogo/cuias#secao-dbcbd086-09b1-4f8e-a5c1-718a3739c551');
  expect(catalog?.ok()).toBe(true);
  await expect(page.locator('main')).toBeVisible();
});
