import { expect, test } from '@playwright/test';

test('home scroll reveal follows the scroll direction', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.dcScrollMotion === 'ready');

  const heading = page.locator('#historia h2');
  await heading.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(heading).toHaveAttribute('data-dc-visible', '');

  for (const sectionHeading of await page.locator('.dc-home-section > h2').all()) {
    await sectionHeading.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(sectionHeading).toHaveAttribute('data-dc-visible', '');
    expect(await sectionHeading.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBeGreaterThan(0);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(heading).not.toHaveAttribute('data-dc-visible', '');
});

test('reduced motion keeps homepage content visible without scroll effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('#historia h2')).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-dc-scroll-motion', 'ready');
});

test('mobile homepage keeps the cover and navigation within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.dc-cover img')).toBeVisible();
  await expect(page.locator('.dc-home-nav')).toBeVisible();
  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
});
