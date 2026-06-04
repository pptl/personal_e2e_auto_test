import { test, expect } from '@playwright/test';
import { CORE_PAGES, Role } from './helpers/constants';

// 依 role 分組，每組共用同一個 storageState（不重複登入）
const roles = [...new Set(CORE_PAGES.map(p => p.role))] as Role[];

for (const role of roles) {
  test.describe(`Smoke — ${role}`, () => {
    test.use({ storageState: `tests/.auth/${role}.json` });

    const pages = CORE_PAGES.filter(p => p.role === role);

    for (const p of pages) {
      test(`${p.name}（${p.path}）可以正常開啟`, async ({ page }) => {
        const jsErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') jsErrors.push(msg.text());
        });

        const pageErrors: string[] = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto(p.path);
        await page.waitForLoadState('networkidle');

        // 驗證 1：頁面不是白屏
        await expect(page.locator('body')).not.toBeEmpty();

        // 驗證 2：沒有頁面層級的 JS 錯誤
        expect(pageErrors).toHaveLength(0);

        // 驗證 3：過濾無害警告後無 console.error
        const realErrors = jsErrors.filter(e =>
          !e.includes('favicon') &&
          !e.includes('DevTools') &&
          !e.includes('ResizeObserver')
        );
        expect(realErrors).toHaveLength(0);
      });
    }
  });
}
