import { test, expect } from '@playwright/test';

const widths = [320,375,390,430,768,1024,1440,1920];

for (const width of widths) {
  test(`referência pública sem transbordamento em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /DOM COSSÉ.*AVIOS DE MATE/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'DESTAQUES' })).toBeVisible();
    await expect(page.locator('.dc-highlight')).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/catalogo');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `artifacts/reference-home-${width}.png`, fullPage: true });
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: 'CATÁLOGO', exact: true })).toBeVisible();
    await expect(page.locator('.dc-category-tile')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `artifacts/reference-catalog-${width}.png`, fullPage: true });
  });
}

test('categoria vazia e navegação pública', async ({ page }) => {
  await page.goto('/catalogo/cuias');
  await expect(page.getByText('Novos modelos em breve. Peça pelo WhatsApp.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pedir no WhatsApp' }).first()).toHaveAttribute('href', /wa\.me\/5551982315818/);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Nossa história' })).toBeVisible();
});

test('capas enviadas aparecem nas categorias corretas', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('link', { name: /CUIAS/ }).locator('img')).toHaveAttribute('src', '/images/categorias/referencia-cuias.png');
  await expect(page.getByRole('link', { name: /BOMBAS/ }).locator('img')).toHaveAttribute('src', '/images/categorias/referencia-bombas.jpg');
  await page.goto('/catalogo/bombas');
  await expect(page.locator('.dc-product-card')).toHaveCount(0);
});

test('animação 3D funciona com ponteiro e respeita movimento reduzido', async ({ page }) => {
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

test('história, contato e âncoras do rodapé', async ({ page }) => {
  await page.goto('/nossa-historia');
  await expect(page.getByRole('heading', { name: 'NOSSA HISTÓRIA' })).toBeVisible();
  await expect(page.getByText(/surgiu da inspiração de seu fundador/)).toBeVisible();
  await page.goto('/contato');
  await expect(page.getByRole('heading', { name: 'FALE COM A DOM COSSÉ' })).toBeVisible();
  await expect(page.locator('.dc-contact-list a[href^="mailto:"]')).toHaveAttribute('href', /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/);
  await page.getByRole('link', { name: 'Bago Virola Alpaca', exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo\/cuias#secao-/);
});
