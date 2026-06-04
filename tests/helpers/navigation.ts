// tests/helpers/navigation.ts
import { Page, expect } from '@playwright/test';
import { SEL } from './constants';

/**
 * 導航到指定頁面，等待載入完成
 */
export async function navigateTo(
  page: Page,
  menuSelector: string,
  expectedUrlPattern: RegExp
) {
  await page.locator(menuSelector).click();
  await expect(page).toHaveURL(expectedUrlPattern, { timeout: 10_000 });

  const spinner = page.locator(SEL.common.loadingSpinner);
  if (await spinner.isVisible().catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 });
  }
}

/**
 * 等待 success toast 出現並驗證
 */
export async function expectSuccess(page: Page, text?: string) {
  const toast = page.locator(SEL.common.successToast);
  await expect(toast).toBeVisible({ timeout: 5_000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
}

/**
 * 等待 error toast 出現並驗證
 */
export async function expectError(page: Page, text?: string) {
  const toast = page.locator(SEL.common.errorToast);
  await expect(toast).toBeVisible({ timeout: 5_000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
}
