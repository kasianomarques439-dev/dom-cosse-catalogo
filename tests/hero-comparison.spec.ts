import { expect, test } from '@playwright/test';

for (const [label, width, height] of [['mobile', 390, 844], ['tablet', 768, 1024], ['laptop', 1024, 768], ['desktop', 1440, 900]] as const) {
  test(`hero premium ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const hero = page.locator('.dc-photo-hero');
    const image = hero.locator('img');
    const buttons = hero.locator('.dc-hero-actions a');
    await expect(image).toHaveCSS('object-fit', 'contain');
    await expect(buttons).toHaveCount(2);
    await expect(hero.getByRole('link', { name: 'Ir para destaques' })).toHaveAttribute('href', '#destaques');
    const bounds = await hero.evaluate(element => {
      const hero = element.getBoundingClientRect();
      const content = element.querySelector('.dc-hero-content')!.getBoundingClientRect();
      const actions = [...element.querySelectorAll('.dc-hero-actions a')].map(item => item.getBoundingClientRect());
      return { heroHeight: hero.height, contentTop: content.top, top: hero.top, bottom: hero.bottom, actions: actions.map(item => ({ left: item.left, right: item.right, top: item.top, bottom: item.bottom })) };
    });
    expect(bounds.contentTop).toBeGreaterThanOrEqual(bounds.top);
    expect(bounds.actions.every(item => item.left >= 0 && item.right <= width && item.top >= bounds.top && item.bottom <= bounds.bottom)).toBe(true);
    if (label === 'mobile') expect(bounds.heroHeight).toBeLessThanOrEqual(height - 80);
    await hero.screenshot({ path: `artifacts/hero-comparison/after-${label}.png` });
    await page.screenshot({ path: `artifacts/hero-comparison/after-page-${label}.png` });
  });
}
