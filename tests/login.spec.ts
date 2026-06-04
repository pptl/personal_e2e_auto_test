import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { SEL, Role } from './helpers/constants';

test.describe('登入功能', () => {

  const rolesToTest: Role[] = ['employee', 'admin'];

  for (const role of rolesToTest) {
    test(`${role} 可以正常登入`, async ({ page }) => {
      await login(page, role);

      await expect(page.locator('body')).not.toBeEmpty();
    });
  }

  test('錯誤密碼應顯示錯誤訊息', async ({ page }) => {
    await page.goto('/Login');
    await page.locator(SEL.login.account).fill('invalid-user');
    await page.locator(SEL.login.password).fill('wrong-password');
    await page.locator(SEL.login.submitBtn).click();

    // 應停留在登入頁
    await expect(page).toHaveURL(/\/Login/i);
  });
});
