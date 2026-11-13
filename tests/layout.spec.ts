import { test, expect } from '@playwright/test';
import { catalogWhatsAppHref, productWhatsAppHref, retailerWhatsAppHref, whatsappNumber } from '../src/lib/links';
import { CUIA_SUBCATEGORIES, LOT_QUANTITIES } from '../src/lib/types';
import { productSchema, settingsSchema } from '../src/lib/validation';

const viewports: [number, number][] = [[320, 568], [320, 720], [360, 640], [360, 800], [375, 667], [390, 844], [393, 852], [402, 874], [414, 896], [430, 932], [440, 956], [480, 960], [768, 1024], [820, 1180], [834, 1112], [915, 412], [1024, 1366], [1280, 800], [1366, 768], [1440, 900], [1600, 900], [1920, 1080]];

for (const [width, height] of viewports) {
  test(`layout responsivo sem rolagem horizontal ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#inicio .hero-banner-image')).toBeVisible();
    await expect(page.locator('#categorias .category-photo-card')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    if (width <= 639) {
      const image = page.locator('#inicio .hero-banner-image');
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1086);
      await expect(image).toHaveCSS('object-fit', 'contain');
      const source = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
      expect(source).toContain('/banners/hero-clean-home.png');
    }
    if (width < 768) {
      await page.waitForFunction(() => { const button = document.querySelector('.menu-button'); return Boolean(button && Object.keys(button).some((key) => key.startsWith('__reactProps'))); });
      const menu = page.getByRole('button', { name: 'Abrir menu' });
      await menu.click();
      await expect(page.locator('.menu-button')).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.menu-button')).toHaveAttribute('aria-expanded', 'false');
    }
  });
}

test('banner desktop usa a arte original e links interativos reais', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('#inicio');
  const image = hero.locator('.hero-banner-image');
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1086);
  await expect(hero.getByRole('heading', { name: /Dom Cossé.*O autêntico mate gaúcho/i })).toBeAttached();
  await expect(hero.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '#catalogo');
  await expect(hero.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute('href', /wa\.me\/5551982315818\?text=/);
  await page.screenshot({ path: 'test-results/final-desktop-1440.png', fullPage: true });
  await page.getByRole('link', { name: 'Ver catálogo' }).click();
  await expect(page).toHaveURL(/#catalogo$/);
});

test('banner mobile preserva toda a arte e escala sem corte em telas estreitas', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (const width of [320, 360, 375, 390, 393, 414, 430]) {
    await page.setViewportSize({ width, height: 850 });
    const hero = page.locator('#inicio');
    const image = hero.locator('.hero-banner-image');
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1086);
    await expect(image).toHaveCSS('object-fit', 'contain');
    const rects = await page.evaluate(() => {
      const heroRect = document.querySelector('#inicio')!.getBoundingClientRect();
      const actions = [...document.querySelectorAll('#inicio .hero-image-link')].map((link) => link.getBoundingClientRect());
      return { width: heroRect.width, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, actionsInside: actions.every((rect) => rect.top >= heroRect.top && rect.bottom <= heroRect.bottom && rect.width >= 44 && rect.height >= 44) };
    });
    expect(Math.abs(rects.width - width)).toBeLessThanOrEqual(1);
    expect(rects.overflow).toBeLessThanOrEqual(1);
    expect(rects.actionsInside).toBe(true);
    if (width === 390) await page.screenshot({ path: 'test-results/final-mobile-390.png', fullPage: true });
  }
});

test('catálogo vazio é informativo e não inventa produto nem mostra filtros inúteis', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Conheça nossos produtos' })).toBeVisible();
  await expect(page.locator('.catalog-empty')).toContainText('Nosso catálogo está em preparação.');
  await expect(page.locator('.catalog-empty')).toContainText('Enquanto isso, consulte cuias, bombas e lotes disponíveis diretamente com nossa equipe.');
  await expect(page.locator('.catalog-empty')).toContainText('Consultar pelo WhatsApp');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('.catalog-filters')).toHaveCount(0);
});

test('categorias filtram o catálogo e o menu aponta para atendimento e essência', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === 'Cuias'); return Boolean(button && Object.keys(button).some((key) => key.startsWith('__reactProps'))); });
  await page.getByRole('button', { name: 'Cuias', exact: true }).click();
  await expect(page.locator('.category-page-heading h2')).toContainText('Cuias');
  await page.getByRole('button', { name: 'TODOS' }).click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Nossa essência' }).click();
  await expect(page).toHaveURL(/#essencia$/);
  await expect(page.locator('#essencia')).toContainText('cuias, bombas e avios para quem valoriza a tradição do mate gaúcho');
  await expect(page.locator('#atacado .retail-options article')).toHaveCount(2);
  await expect(page.locator('#atacado')).toContainText('Varejo e lojistas');
  await expect(page.locator('#atacado .retail-options')).toContainText('Para você');
  await expect(page.locator('#atacado .retail-options')).toContainText('Para lojistas');
});

test('seções da home seguem a ordem do layout e FAQ usa perguntas expansíveis', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const order = await page.evaluate(() => {
    const featured = document.querySelector('#destaques');
    const categories = document.querySelector('#categorias');
    return !featured || !categories || categories.compareDocumentPosition(featured) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  expect(order).toBe(true);
  await expect(page.locator('#duvidas details')).toHaveCount(4);
  const measureQuestion = page.locator('#duvidas details').last();
  await measureQuestion.locator('summary').click();
  await expect(measureQuestion).toHaveAttribute('open', '');
  await expect(measureQuestion).toContainText('Para consultar as medidas dos modelos disponíveis, fale com nossa equipe pelo WhatsApp.');
});

test('dois cards de categoria mobile equilibrados e atalhos sociais fixos e visíveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const categoryRects = await page.locator('#categorias .category-photo-card').evaluateAll((cards) => cards.map((card) => {
    const rect = card.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  expect(categoryRects).toHaveLength(2);
  expect(Math.abs(categoryRects[0].width - categoryRects[1].width)).toBeLessThanOrEqual(1);
  expect(Math.abs(categoryRects[0].height - categoryRects[1].height)).toBeLessThanOrEqual(1);
  await expect(page.locator('#categorias .category-photo-card .category-label-group')).toHaveCount(2);
  await expect(page.locator('#categorias .category-photo-card .category-name')).toHaveText(['Cuias', 'Bombas']);
  await expect(page.locator('#categorias .category-photo-card .category-arrow')).toHaveCount(2);
  await expect(page.locator('#categorias .category-cuias')).toHaveAttribute('style', /cuias-card\.png/);
  await expect(page.locator('#categorias .category-bombas')).toHaveAttribute('style', /categorias\/bombas\.png/);
  await expect(page.locator('#categorias')).toContainText('Conheça nossos produtos');
  await expect(page.locator('#categorias')).toContainText('Cuias');
  await expect(page.locator('#categorias')).toContainText('Bombas');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Lotes' })).toBeVisible();
  for (const name of ['WhatsApp', 'Instagram']) {
    const social = page.locator(`.social-float[aria-label="${name}"]`);
    await expect(social).toBeVisible();
  }
  await expect(page.locator('.social-floats')).toHaveCSS('position', 'fixed');
});

test('mensagem de WhatsApp identifica o produto, a categoria e o atendimento a lojistas', () => {
  const name = 'Cuia São João & Família #1';
  const product = new URL(productWhatsAppHref('+55 (11) 99999-8888', name, 'cuias')!);
  expect(product.host).toBe('wa.me');
  expect(product.pathname).toBe('/5511999998888');
  expect(product.searchParams.get('text')).toContain(name);
  expect(new URL(catalogWhatsAppHref('+55 51 98231-5818', 'bombas')!).searchParams.get('text')).toContain('categoria bombas');
  expect(new URL(retailerWhatsAppHref('+55 (11) 99999-8888')!).searchParams.get('text')).toContain('Sou lojista');
  expect(whatsappNumber('+55 (55) 99122-5365')).toBe('5555991225365');
});

test('categorias, lotes e ordem de destaque têm validação compatível', () => {
  for (const subtype of CUIA_SUBCATEGORIES) {
    expect(productSchema.safeParse({ name: 'Cuia', description: '', price: 1, category: 'cuias', cuia_subcategory: subtype.value, status: 'disponivel' }).success).toBe(true);
    expect(productSchema.safeParse({ name: 'Bomba', description: '', price: 1, category: 'bombas', cuia_subcategory: subtype.value, status: 'disponivel' }).success).toBe(false);
  }
  for (const quantity of LOT_QUANTITIES) expect(productSchema.safeParse({ name: `Lote ${quantity}`, description: '', price: null, category: 'lotes-de-cuias', lot_quantity: quantity, status: 'disponivel' }).success).toBe(true);
  const featured = productSchema.safeParse({ name: 'Cuia destaque', description: '', price: 1, category: 'cuias', is_featured: true, featured_order: 3, status: 'disponivel' });
  expect(featured.success && featured.data.featured_order).toBe(3);
  expect(productSchema.safeParse({ name: 'Cuia', description: '', price: 1, category: 'cuias', is_featured: true, featured_order: 1000, status: 'disponivel' }).success).toBe(false);
});

test('configurações normalizam o perfil e preservam contatos preenchidos', () => {
  const settings = settingsSchema.parse({ whatsapp: '+55 51 98231-5818', instagram: '@domcosse', company_name: 'Dom Cossé', email: 'contato@example.com', address: 'Rua Central, 1', city: 'Ijuí', state: 'RS', postal_code: '98700-262' });
  expect(settings.instagram).toBe('https://www.instagram.com/domcosse/');
  expect(settings.whatsapp).toBe('+55 51 98231-5818');
});

test('rotas públicas técnicas e login administrativo continuam acessíveis', async ({ page, request }) => {
  await expect(await request.get('/robots.txt')).toBeOK();
  await expect(await request.get('/sitemap.xml')).toBeOK();
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
});
