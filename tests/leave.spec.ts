import { test, expect } from '@playwright/test';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL } from './helpers/constants';

test.describe('休假申請流程', () => {
  test.use({ storageState: 'tests/.auth/employee.json' });

  test('員工可以進入休假頁面', async ({ page }) => {
    await navigateTo(page, SEL.nav.leave, /leave/);

    await expect(page.locator(SEL.common.pageTitle)).toBeVisible();
  });

  test('員工可以申請特休', async ({ page }) => {
    await navigateTo(page, SEL.nav.leave, /leave/);

    // TODO：根據實際 ERP 流程補充
    // await page.locator(SEL.leave.typeSelect).selectOption('特休');
    // await page.locator(SEL.leave.dateStart).fill('2026-06-02');
    // await page.locator(SEL.leave.dateEnd).fill('2026-06-02');
    // await page.locator(SEL.leave.reason).fill('個人因素');
    // await page.locator(SEL.leave.submitBtn).click();
    // await expectSuccess(page, '申請成功');
  });
});
