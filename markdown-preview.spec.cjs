const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'http://127.0.0.1:8788';
const paths = (process.env.PREVIEW_PATHS || '/README/,/docs/ui/README/,/docs/product/module-feature-inventory/,/docs/product/current-progress/,/docs/tech/technical-proposal/,/docs/tech/architecture-report/,/docs/tech/database-and-cache-design/,/docs/tech/base-data-and-schema-review/,/docs/plans/2026-04-24-multiplatform-mvp/,/docs/reports/2026-04-25-inr-refinement-implementation/').split(',').filter(Boolean);

test('landing exposes categorized document entrypoints', async ({ page }) => {
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await expect(page.locator('text=抗凝小助手文档入口')).toHaveCount(1);
  await expect(page.locator('text=需求与功能清单')).toHaveCount(1);
  await expect(page.locator('text=UI 与原型')).toHaveCount(1);
  await expect(page.locator('text=技术方案与架构')).toHaveCount(1);
  for (const href of [
    '/docs/product/module-feature-inventory/',
    '/docs/product/current-progress/',
    '/docs/ui/README/',
    '/docs/tech/technical-proposal/',
    '/docs/tech/architecture-report/',
    '/docs/tech/database-and-cache-design/',
    '/docs/tech/base-data-and-schema-review/',
    '/docs/plans/2026-04-24-multiplatform-mvp/',
    '/docs/reports/2026-04-25-inr-refinement-implementation/'
  ]) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});

for (const path of paths) {
  test(`markdown preview renders ${path}`, async ({ page }) => {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.mdDoc')).toHaveCount(1);
    await expect(page.locator('.mdToc strong')).toContainText('文档目录');
    await expect(page.locator('.mdMeta a')).toHaveCount(1);
    await expect(page).toHaveTitle(/文档预览/);
  });
}

test('markdown preview renders pipe tables as tables', async ({ page }) => {
  await page.goto(`${base}/docs/product/current-progress/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.mdDoc table').first()).toBeVisible();
  await expect(page.locator('.mdDoc th').first()).toContainText('项目');
});
