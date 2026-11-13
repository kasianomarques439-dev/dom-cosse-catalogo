import { expect, test } from '@playwright/test';

const scrollViewports: [number, number][] = [
  [320, 720],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [844, 390],
  [1024, 768],
  [1440, 900],
];

test('scroll reveals do not change document height and floating links stay fixed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveClass(/motion-ready/);
  await expect.poll(() => page.locator('#atacado').evaluate((section) => getComputedStyle(section).transitionProperty)).toContain('opacity');

  for (const [width, height] of scrollViewports) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(60);

    const before = await page.evaluate(() => {
      const social = document.querySelector<HTMLElement>('.social-floats');
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        socialBottom: social?.getBoundingClientRect().bottom ?? null,
      };
    });

    for (const distance of [260, 480, 320, -180, 620, -460, 900, -340, 1_200, 5_000]) {
      await page.mouse.wheel(0, distance);
      await page.waitForTimeout(70);
    }
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => {
      const social = document.querySelector<HTMLElement>('.social-floats');
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        socialBottom: social?.getBoundingClientRect().bottom ?? null,
        socialPosition: social ? getComputedStyle(social).position : null,
        hiddenRevealCount: document.querySelectorAll('[data-reveal]:not(.is-visible)').length,
      };
    });

    expect(after.pageWidth - after.viewportWidth, `${width}px horizontal overflow`).toBeLessThanOrEqual(1);
    expect(after.documentHeight, `${width}px scroll height changed after reveals`).toBe(before.documentHeight);
    expect(after.socialPosition).toBe('fixed');
    expect(Math.abs((after.socialBottom ?? 0) - (before.socialBottom ?? 0)), `${width}px floating links moved`).toBeLessThanOrEqual(1);
    expect(after.hiddenRevealCount, `${width}px skipped a reveal during a fast scroll`).toBe(0);
  }
});

test('banner reserves its dimensions while the image is loading on mobile', async ({ page }) => {
  let delayedBannerRequest = false;
  await page.route('**/banners/hero-clean-home.png', async (route) => {
    delayedBannerRequest = true;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#inicio .hero-banner-image')).toBeVisible();

  const before = await page.locator('#inicio').boundingBox();
  const beforeDocumentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(before).not.toBeNull();
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(120);
  await page.mouse.wheel(0, -120);
  await expect.poll(() => delayedBannerRequest).toBe(true);
  await expect.poll(() => page.locator('#inicio .hero-banner-image').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.waitForTimeout(500);

  const after = await page.locator('#inicio').boundingBox();
  const afterDocumentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(after).not.toBeNull();
  expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThanOrEqual(1);
  expect(afterDocumentHeight).toBe(beforeDocumentHeight);
});
