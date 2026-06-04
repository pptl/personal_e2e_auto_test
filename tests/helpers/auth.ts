// tests/helpers/auth.ts
import { Page, expect } from '@playwright/test';
import { ACCOUNTS, Role, SEL } from './constants';

/**
 * 登入指定角色
 */
export async function login(page: Page, role: Role) {
  const { account, password, redirectUrl } = ACCOUNTS[role];

  await page.goto('/Login');
  await page.locator(SEL.login.account).fill(account);
  await page.locator(SEL.login.password).fill(password);
  await page.locator(SEL.login.submitBtn).click();

  // 等待跳離登入頁即視為登入成功
  await expect(page).not.toHaveURL(/\/Login/i, { timeout: 10_000 });
}

/**
 * 登出
 */
export async function logout(page: Page) {
  await page.goto('/logout');
  await expect(page).toHaveURL(/login/);
}
