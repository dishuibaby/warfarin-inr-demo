const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'http://127.0.0.1:8788';
const platforms = ['wechat', 'android', 'ios'];
const routes = [
  'home',
  'records',
  'inr',
  'me',
  'login',
  'inr-settings',
  'inr-methods',
  'test-settings',
  'dose-settings',
  'after-dose-rule',
  'notifications',
  'account',
  'profile',
  'help',
];

test.describe('static prototype route coverage', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 3 });

  for (const platform of platforms) {
    for (const route of routes) {
      test(`${platform}/${route} renders centralized prototype shell`, async ({ page }) => {
        await page.goto(`${base}/${platform}/${route}/`, { waitUntil: 'networkidle' });
        await expect(page.locator('.app-shell')).toHaveCount(1);
        await expect(page.locator('.device')).toHaveClass(new RegExp(platform));
      });
    }
  }
});
