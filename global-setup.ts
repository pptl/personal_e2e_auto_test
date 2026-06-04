// global-setup.ts
// 在所有測試前執行一次，為每個 role 登入並儲存 session（cookie/localStorage）
// 測試執行時直接讀取 .auth/<role>.json，不需重複登入

import { chromium } from '@playwright/test';
import { ACCOUNTS, Role, SEL } from './tests/helpers/constants';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const AUTH_DIR = 'tests/.auth';

async function globalSetup() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();
  const roles = Object.keys(ACCOUNTS) as Role[];

  for (const role of roles) {
    const { account, password } = ACCOUNTS[role];
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();

    await page.goto('/Login');
    await page.locator(SEL.login.account).fill(account);
    await page.locator(SEL.login.password).fill(password);
    await page.locator(SEL.login.submitBtn).click();

    // 等待離開登入頁，代表登入成功
    await page.waitForURL(url => !url.href.toLowerCase().includes('login'), {
      timeout: 10_000,
    });

    await context.storageState({ path: `${AUTH_DIR}/${role}.json` });
    await context.close();
    console.log(`[global-setup] ${role} 登入完成 → ${AUTH_DIR}/${role}.json`);
  }

  await browser.close();
}

export default globalSetup;
