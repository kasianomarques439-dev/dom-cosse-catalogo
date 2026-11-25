import { expect, test } from '@playwright/test';

test('Cultura do Mate mostra os quatro conteúdos completos em cards acessíveis', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#avios');
  await expect(section.getByRole('heading', { name: 'Conheça os Avios de Mate' })).toBeVisible();

  const cards = section.locator('.dc-education-grid article');
  await expect(cards).toHaveCount(4);

  const titles = ['Avios de Mate', 'Cuia Bago de Touro', 'Porongo Ferro', 'Metal Alpaca'];
  for (const [index, title] of titles.entries()) {
    const card = cards.nth(index);
    await expect(card.getByRole('heading', { name: title })).toBeVisible();
    const disclosure = card.locator('details');
    await expect(disclosure.locator('summary')).toContainText('Saiba mais');
    await disclosure.locator('summary').click();
    await expect(disclosure).toHaveAttribute('open', '');
    await expect(disclosure.locator('.dc-education-copy')).toBeVisible();
    await expect(disclosure.locator('summary')).toContainText('Mostrar menos');
  }

  const copy = await section.innerText();
  for (const requiredPhrase of [
    'preparar, transportar e servir chimarrão ou mate',
    'madeira, inox ou vidro',
    'filtro na ponta',
    'água quente (ou gelada, no caso de tereré)',
    'guardar e transportar os avios',
    'bolsas testiculares de touros',
    'clara, avermelhada ou preta',
    'suporte de couro',
    'gravações personalizadas',
    'planta de braço, da família das abóboras',
    'região específica do estado do Rio Grande do Sul',
    'não há necessidade de cura',
    'prata alemã ou nickel silver',
    '65% de cobre, 18% de níquel e 17% de zinco',
    'à temperatura ambiente',
    'pátina',
    'apetrechos de montaria',
    'movimentos de alta relojoaria',
  ]) expect(copy).toContain(requiredPhrase);
});

test('cards abertos da Cultura do Mate não criam rolagem horizontal em telas móveis', async ({ page }) => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    for (const disclosure of await page.locator('#avios details').all()) await disclosure.locator('summary').click();
    const layout = await page.evaluate(() => ({
      width: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')].map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        width: element.getBoundingClientRect().width,
        right: element.getBoundingClientRect().right,
      })).filter((element) => element.right > window.innerWidth - 0.1).sort((a, b) => b.right - a.right).slice(0, 12),
    }));
    expect(layout.documentWidth <= layout.width, `largura ${width}px: ${JSON.stringify(layout)}`).toBe(true);
  }
});
