const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'http://127.0.0.1:8788';

test.describe('2026-04 INR product refinement acceptance', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 3 });

  test('home exposes latest INR, next test time, dual-line trend and mandatory prominent reminder', async ({ page }) => {
    await page.goto(`${base}/wechat/home/`, { waitUntil: 'networkidle' });
    await expect(page.locator('.heroDose')).toContainText('今日服药');
    await expect(page.locator('.inrCard')).toContainText('最新 INR');
    await expect(page.locator('.inrCard .inrMetric strong')).toHaveText('2.1');
    await expect(page.locator('.inrCard')).toContainText('校准前 2.0');
    await expect(page.locator('.inrCard')).toContainText('下次检测');
    await expect(page.locator('.homeReminder')).toContainText('超明显提醒');
    await expect(page.locator('.valueChart .legend')).toContainText('校准后');
    await expect(page.locator('.valueChart .legend')).toContainText('校准前');
    await expect(page.locator('svg .line.cal')).toHaveCount(1);
    await expect(page.locator('svg .line.raw')).toHaveCount(1);
  });

  test('dose completion requires choosing tomorrow dose with planned and manual UI, and no catch-up action', async ({ page }) => {
    await page.goto(`${base}/wechat/home/`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).not.toContainText('补服');
    await page.getByRole('button', { name: '完成服药' }).click();
    await expect(page.locator('#doseDoneSheet')).toHaveClass(/open/);
    await expect(page.locator('#doseDoneSheet')).toContainText('选择明日剂量');
    await expect(page.locator('#doseDoneSheet')).toContainText('按计划服用');
    await expect(page.locator('#doseDoneSheet')).toContainText('手动输入');
    await expect(page.locator('#doseDoneSheet input[aria-label="手动输入明日剂量"]')).toHaveCount(1);
    await expect(page.locator('#doseDoneSheet')).toContainText('系统记录当前操作时间');
  });

  test('INR page shows weak vs strong abnormal tiers and raw value is visually secondary', async ({ page }) => {
    await page.goto(`${base}/wechat/inr/`, { waitUntil: 'networkidle' });
    await expect(page.locator('.alert.danger')).toContainText('必须关注');
    await expect(page.locator('.status.soft').first()).toContainText('弱提示');
    await expect(page.locator('.status.danger').first()).toContainText('强提示');
    const rawStyle = await page.locator('.inrRecord small').first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: parseFloat(s.fontSize), color: s.color, opacity: s.opacity };
    });
    const mainStyle = await page.locator('.inrRecordValue').first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: parseFloat(s.fontSize), color: s.color, opacity: s.opacity };
    });
    expect(rawStyle.fontSize).toBeLessThan(mainStyle.fontSize);
  });

  test('settings support detection methods, offset rule and flexible day/week/month cycle', async ({ page }) => {
    await page.goto(`${base}/wechat/inr-settings/`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('检测方式');
    await expect(page.locator('body')).toContainText('偏移量');
    await expect(page.locator('body')).toContainText('校正后 INR');
    await expect(page.locator('body')).toContainText('校准前');
    await expect(page.locator('body')).toContainText('检测周期');
    await page.getByRole('button', { name: '设置检测周期' }).click();
    await expect(page.locator('#cycleDialog')).toHaveClass(/show/);
    await expect(page.locator('#cycleDialog .cycleTabs')).toContainText('按天');
    await expect(page.locator('#cycleDialog .cycleTabs')).toContainText('按周');
    await expect(page.locator('#cycleDialog .cycleTabs')).toContainText('按月');
  });
});
