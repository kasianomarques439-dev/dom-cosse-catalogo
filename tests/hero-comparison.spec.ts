import { expect, test } from '@playwright/test';

for (const [label, width, height, expected] of [['mobile', 390, 844, 'banner-mobile'], ['tablet', 768, 1024, 'banner-mobile'], ['desktop', 1440, 900, 'banner-desktop']] as const) {
  test(`banner responsive ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const cover = page.locator('.dc-cover');
    const image = cover.locator('img');
    await expect(image).toHaveCSS('object-fit', 'contain');
    expect(await image.evaluate(element => (element as HTMLImageElement).currentSrc)).toContain(expected);
    const bounds = await cover.evaluate(element => {
      const cover = element.getBoundingClientRect();
      const link = element.querySelector('.dc-cover-hotspot')!.getBoundingClientRect();
      return { cover, link: { left: link.left, top: link.top, right: link.right, bottom: link.bottom, width: link.width, height: link.height } };
    });
    expect(bounds.link.left).toBeGreaterThanOrEqual(bounds.cover.left);
    expect(bounds.link.right).toBeLessThanOrEqual(bounds.cover.right);
    expect(bounds.link.top).toBeGreaterThanOrEqual(bounds.cover.top);
    expect(bounds.link.bottom).toBeLessThanOrEqual(bounds.cover.bottom);
    expect(bounds.link.width).toBeGreaterThanOrEqual(44);
    expect(bounds.link.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `artifacts/hero-comparison/after-${label}.png`, fullPage: true });
  });
}
