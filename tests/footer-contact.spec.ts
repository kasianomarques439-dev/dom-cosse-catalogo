import { expect, test } from '@playwright/test';

for (const width of [360, 390, 768, 1366, 1920]) {
  test(`contato do rodapé em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    const footer = page.locator('.dc-footer');
    const email = footer.getByRole('link', { name: 'josemaria.sul@gmail.com' });
    const address = footer.getByRole('link', { name: /Rua José Bonifácio, 328, Sala 312/ });
    await expect(email).toHaveAttribute('href', 'mailto:josemaria.sul@gmail.com');
    await expect(address).toContainText('Centro – Ijuí/RS – CEP 98700-000');
    await expect(address).toHaveAttribute('target', '_blank');
    await expect(address).toHaveAttribute('rel', /noopener/);
    const maps = new URL((await address.getAttribute('href'))!);
    expect(maps.searchParams.get('query')).toBe('Rua José Bonifácio 328 Centro Ijuí RS');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('página de contato reaproveita e-mail e endereço', async ({ page }) => {
  await page.goto('/contato');
  await expect(page.locator('.dc-contact-list a[href="mailto:josemaria.sul@gmail.com"]')).toBeVisible();
  await expect(page.locator('.dc-contact-list').getByText(/CEP 98700-000/)).toBeVisible();
});
