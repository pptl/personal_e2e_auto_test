import { test, expect } from '@playwright/test';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL } from './helpers/constants';

test.describe('休假審核流程', () => {
  test.use({ storageState: 'tests/.auth/manager.json' });

  test('主管可以進入審核頁面', async ({ page }) => {
    await navigateTo(page, SEL.nav.approval, /approval/);

    await expect(page.locator(SEL.common.pageTitle)).toBeVisible();
  });

  test('主管可以核准休假', async ({ page }) => {
    await navigateTo(page, SEL.nav.approval, /approval/);

    // TODO：根據實際 ERP 流程補充
    // await page.locator(SEL.approval.pendingList).first().click();
    // await page.locator(SEL.approval.approveBtn).click();
    // await expectSuccess(page, '已核准');
  });
});
