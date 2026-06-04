import { test, expect } from '@playwright/test';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL, isKnownChange } from './helpers/constants';

test.describe('排班流程', () => {
  test.use({ storageState: 'tests/.auth/manager.json' });

  test('主管可以進入排班頁面', async ({ page }) => {
    await navigateTo(page, SEL.nav.scheduling, /scheduling/);

    await expect(page.locator(SEL.common.pageTitle)).toBeVisible();
  });

  test('主管可以建立排班', async ({ page }) => {
    test.skip(isKnownChange('scheduling-create'), '新版本此流程已變更');

    await navigateTo(page, SEL.nav.scheduling, /scheduling/);

    // TODO：根據實際 ERP 流程補充
    // await page.locator(SEL.scheduling.employeeSearch).fill('emp-001');
    // await page.locator(SEL.scheduling.datePicker).fill('2026-06-02');
    // await page.locator(SEL.scheduling.shiftMorning).click();
    // await page.locator(SEL.scheduling.submitBtn).click();
    // await expectSuccess(page, '排班成功');
  });
});
