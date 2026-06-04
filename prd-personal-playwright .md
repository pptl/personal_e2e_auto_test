# PRD：個人 Playwright E2E 腳本 — Refactor 安全網

## 1. 目標

在 ERP 舊版本上用 Playwright 錄製 / 撰寫核心操作流程腳本，建立 baseline。Refactor 切換到新版本後，用同一套腳本驗證「行為是否保持一致」，提前抓出 Refactor 引入的問題。

這是個人開發工具，不接 CI、不需要團隊配合、不需要老闆批准。

---

## 2. 技術環境

| 項目 | 技術 |
|------|------|
| ERP 後端 | Java（Spring Boot） |
| ERP 前端 | React |
| 測試工具 | Playwright（TypeScript） |
| 執行環境 | 本機（開發者電腦） |
| 瀏覽器模式 | 預設 headless，需要看操作過程時用 `--headed` |
| 目標環境 | 本地開發環境 http://localhost:8080（可改） |

---

## 3. 專案結構

```
my-e2e-tests/
├── tests/
│   ├── helpers/
│   │   ├── auth.ts                ← 登入/登出 helper
│   │   ├── navigation.ts         ← 頁面導航 helper
│   │   └── constants.ts          ← 帳號密碼、URL 等常數
│   │
│   ├── 01-login.spec.ts          ← 各角色登入驗證
│   ├── 02-scheduling.spec.ts     ← 排班核心流程
│   ├── 03-leave.spec.ts          ← 休假申請流程
│   ├── 04-leave-approve.spec.ts  ← 休假審核流程
│   ├── 05-smoke.spec.ts          ← 全頁面健康檢查
│   └── (後續擴充的 spec 放這裡)
│
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 4. 設定檔

### 4.1 package.json

```json
{
  "name": "erp-e2e-personal",
  "private": true,
  "scripts": {
    "smoke": "npx playwright test tests/05-smoke.spec.ts",
    "test:login": "npx playwright test tests/01-login.spec.ts",
    "test:scheduling": "npx playwright test tests/02-scheduling.spec.ts",
    "test:leave": "npx playwright test tests/03-leave.spec.ts tests/04-leave-approve.spec.ts",
    "test:all": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:debug": "npx playwright test --debug",
    "report": "npx playwright show-report",
    "codegen": "npx playwright codegen http://localhost:8080"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0"
  }
}
```

### 4.2 playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    headless: true,              // 預設不開瀏覽器，用 --headed 開啟
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'on-failure' }],
  ],
  outputDir: './test-results',
});
```

### 4.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["tests/**/*.ts", "playwright.config.ts"]
}
```

### 4.4 .gitignore

```
node_modules/
test-results/
playwright-report/
```

---

## 5. Helper 模組

所有腳本共用的工具，避免每個 spec 重複寫登入邏輯。

### 5.1 constants.ts

集中管理帳號、密碼、URL、常用 selector，方便舊版 → 新版切換時統一修改。

```typescript
// tests/helpers/constants.ts

// ──────────────────────────────
// 測試帳號
// ──────────────────────────────
export const ACCOUNTS = {
  manager: {
    account: 'mgr-001',
    password: 'Test1234!',
    displayName: '主管A',
    redirectUrl: 'dashboard',      // 登入後跳轉的 URL pattern
  },
  employee: {
    account: 'emp-001',
    password: 'Test1234!',
    displayName: '員工A',
    redirectUrl: 'dashboard',
  },
  admin: {
    account: 'adm-001',
    password: 'Test1234!',
    displayName: '管理員A',
    redirectUrl: 'dashboard',      // 如果 admin 導向不同頁面，改這裡
  },
  hr: {
    account: 'hr-001',
    password: 'Test1234!',
    displayName: 'HR A',
    redirectUrl: 'dashboard',
  },
} as const;

export type Role = keyof typeof ACCOUNTS;

// ──────────────────────────────
// Selector 集中管理
// 舊版 → 新版切換時，只需要改這裡
// ──────────────────────────────
export const SEL = {
  // 登入頁
  login: {
    account: '#account',             // 改成你的實際 selector
    password: '#password',
    submitBtn: '#login-btn',
    errorMsg: '.login-error',
  },

  // 導航選單
  nav: {
    scheduling: 'text=排班管理',
    leave: 'text=休假申請',
    payroll: 'text=薪資管理',
    attendance: 'text=打卡記錄',
    approval: 'text=待審核',
  },

  // 排班頁面
  scheduling: {
    employeeSearch: '#employee-search',
    datePicker: '#schedule-date',
    shiftMorning: '[value="morning"]',
    shiftAfternoon: '[value="afternoon"]',
    shiftNight: '[value="night"]',
    submitBtn: '#schedule-submit',
  },

  // 休假頁面
  leave: {
    typeSelect: '#leave-type',
    dateStart: '#leave-date-start',
    dateEnd: '#leave-date-end',
    reason: '#leave-reason',
    submitBtn: '#leave-submit',
  },

  // 審核頁面
  approval: {
    pendingList: '.pending-list',
    approveBtn: '.approve-btn',
    rejectBtn: '.reject-btn',
  },

  // 共用
  common: {
    successToast: '.toast-success, .ant-message-success, [role="alert"]',
    errorToast: '.toast-error, .ant-message-error',
    loadingSpinner: '.loading, .ant-spin',
    pageTitle: 'h1, .page-title',
  },
} as const;

// ──────────────────────────────
// 核心頁面路徑（smoke test 用）
// ──────────────────────────────
export const CORE_PAGES = [
  { name: '首頁',   path: '/dashboard',   role: 'manager' as Role },
  { name: '排班',   path: '/scheduling',  role: 'manager' as Role },
  { name: '休假',   path: '/leave',       role: 'employee' as Role },
  { name: '薪資',   path: '/payroll',     role: 'manager' as Role },
  { name: '打卡',   path: '/attendance',  role: 'employee' as Role },
] as const;

// ──────────────────────────────
// Refactor 標記
// 新版本已知變更的流程，跑測試時這些失敗是「預期中」的
// ──────────────────────────────
export const KNOWN_CHANGES = [
  // 'scheduling-create',        ← 取消註解代表這個測試在新版中預期會不同
  // 'leave-apply',
] as const;

export function isKnownChange(testId: string): boolean {
  return KNOWN_CHANGES.includes(testId as any);
}

/**
 * 在 test 裡使用：
 * 
 *   import { test } from '@playwright/test';
 *   import { isKnownChange } from './helpers/constants';
 * 
 *   test('主管可以建立排班', async ({ page }) => {
 *     test.skip(isKnownChange('scheduling-create'), '新版本此流程已變更');
 *     // ... 測試內容
 *   });
 * 
 * 當 'scheduling-create' 在 KNOWN_CHANGES 裡時，
 * 該測試會被標記為 skip 而非 fail。
 */
```

### 5.2 auth.ts

```typescript
// tests/helpers/auth.ts
import { Page, expect } from '@playwright/test';
import { ACCOUNTS, Role, SEL } from './constants';

/**
 * 登入指定角色
 */
export async function login(page: Page, role: Role) {
  const { account, password, redirectUrl } = ACCOUNTS[role];

  await page.goto('/login');
  await page.locator(SEL.login.account).fill(account);
  await page.locator(SEL.login.password).fill(password);
  await page.locator(SEL.login.submitBtn).click();

  // 等待登入完成（不同角色可能導向不同頁面）
  await expect(page).toHaveURL(new RegExp(redirectUrl), { timeout: 10_000 });
}

/**
 * 登出
 */
export async function logout(page: Page) {
  // 根據你的 ERP 實際登出方式調整
  // 方式 1：點擊使用者頭像 → 登出
  // await page.locator('.user-avatar').click();
  // await page.locator('text=登出').click();

  // 方式 2：直接導航到 logout URL
  await page.goto('/logout');
  await expect(page).toHaveURL(/login/);
}
```

### 5.3 navigation.ts

```typescript
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

  // 等待 loading 消失
  const spinner = page.locator(SEL.common.loadingSpinner);
  if (await spinner.isVisible().catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 });
  }
}

/**
 * 等待 toast 訊息出現並驗證
 */
export async function expectSuccess(page: Page, text?: string) {
  const toast = page.locator(SEL.common.successToast);
  await expect(toast).toBeVisible({ timeout: 5_000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
}

export async function expectError(page: Page, text?: string) {
  const toast = page.locator(SEL.common.errorToast);
  await expect(toast).toBeVisible({ timeout: 5_000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
}
```

---

## 6. 測試腳本

### 6.1 01-login.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { ACCOUNTS, SEL, Role } from './helpers/constants';

test.describe('登入功能', () => {

  const rolesToTest: Role[] = ['manager', 'employee', 'admin', 'hr'];

  for (const role of rolesToTest) {
    test(`${role} 可以正常登入`, async ({ page }) => {
      await login(page, role);

      // 驗證登入成功後的頁面
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }

  test('錯誤密碼應顯示錯誤訊息', async ({ page }) => {
    await page.goto('/login');
    await page.locator(SEL.login.account).fill('mgr-001');
    await page.locator(SEL.login.password).fill('wrong-password');
    await page.locator(SEL.login.submitBtn).click();

    // 應該停留在登入頁，顯示錯誤
    await expect(page).toHaveURL(/login/);
    await expect(page.locator(SEL.login.errorMsg)).toBeVisible();
  });
});
```

### 6.2 02-scheduling.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL, isKnownChange } from './helpers/constants';

test.describe('排班流程', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'manager');
  });

  test('主管可以進入排班頁面', async ({ page }) => {
    await navigateTo(page, SEL.nav.scheduling, /scheduling/);

    // 頁面正常載入
    await expect(page.locator(SEL.common.pageTitle)).toBeVisible();
  });

  test('主管可以建立排班', async ({ page }) => {
    // 新版本改了排班流程時，取消 KNOWN_CHANGES 裡的 'scheduling-create' 註解
    test.skip(isKnownChange('scheduling-create'), '新版本此流程已變更');

    await navigateTo(page, SEL.nav.scheduling, /scheduling/);

    // 搜尋員工
    await page.locator(SEL.scheduling.employeeSearch).fill('emp-001');
    // TODO：根據你的 ERP 實際流程，補充以下操作
    // 選擇員工 → 選擇日期 → 選擇班別 → 送出

    // await page.locator(SEL.scheduling.datePicker).fill('2026-06-02');
    // await page.locator(SEL.scheduling.shiftMorning).click();
    // await page.locator(SEL.scheduling.submitBtn).click();

    // 驗證成功
    // await expectSuccess(page, '排班成功');
  });
});
```

### 6.3 03-leave.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL } from './helpers/constants';

test.describe('休假申請流程', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'employee');
  });

  test('員工可以進入休假頁面', async ({ page }) => {
    await navigateTo(page, SEL.nav.leave, /leave/);

    await expect(page.locator(SEL.common.pageTitle)).toBeVisible();
  });

  test('員工可以申請特休', async ({ page }) => {
    await navigateTo(page, SEL.nav.leave, /leave/);

    // TODO：根據你的 ERP 實際流程填入
    // await page.locator(SEL.leave.typeSelect).selectOption('特休');
    // await page.locator(SEL.leave.dateStart).fill('2026-06-02');
    // await page.locator(SEL.leave.dateEnd).fill('2026-06-02');
    // await page.locator(SEL.leave.reason).fill('個人因素');
    // await page.locator(SEL.leave.submitBtn).click();

    // await expectSuccess(page, '申請成功');
  });
});
```

### 6.4 04-leave-approve.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL } from './helpers/constants';

test.describe('休假審核流程', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'manager');
  });

  test('主管可以進入審核頁面', async ({ page }) => {
    await navigateTo(page, SEL.nav.approval, /approval/);

    await expect(page.locator(SEL.common.pageTitle)).toBeVisible();
  });

  test('主管可以核准休假', async ({ page }) => {
    await navigateTo(page, SEL.nav.approval, /approval/);

    // TODO：根據你的 ERP 實際流程填入
    // 找到待審核的申請 → 點擊核准
    // await page.locator(SEL.approval.pendingList).first().click();
    // await page.locator(SEL.approval.approveBtn).click();

    // await expectSuccess(page, '已核准');
  });
});
```

### 6.5 05-smoke.spec.ts（最重要）

Smoke test 不測功能細節，只測「核心頁面能不能打開、有沒有 JS 錯誤」。Refactor 後第一時間跑這個。

```typescript
import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';
import { CORE_PAGES, SEL } from './helpers/constants';

test.describe('Smoke Test — 核心頁面健康檢查', () => {

  for (const p of CORE_PAGES) {
    test(`${p.name}（${p.path}）以 ${p.role} 身份可以正常開啟`, async ({ page }) => {
      // 用該頁面對應的角色登入
      await login(page, p.role);

      // 攔截 console.error
      const jsErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          jsErrors.push(msg.text());
        }
      });

      // 攔截未捕捉的頁面錯誤
      const pageErrors: string[] = [];
      page.on('pageerror', err => {
        pageErrors.push(err.message);
      });

      // 導航到頁面
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');

      // 驗證 1：頁面不是白屏
      await expect(page.locator('body')).not.toBeEmpty();

      // 驗證 2：沒有頁面層級的 JS 錯誤
      expect(pageErrors).toHaveLength(0);

      // 驗證 3：console.error 過濾掉常見無害警告
      const realErrors = jsErrors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('DevTools') &&
        !e.includes('ResizeObserver')
      );
      expect(realErrors).toHaveLength(0);
    });
  }
});
```

### 6.6 README.md

```markdown
# ERP 個人 E2E 測試工具

Refactor 安全網：在舊版本建立 baseline，新版本跑同一套腳本驗證行為一致。

## 安裝

\`\`\`bash
npm install
npx playwright install
\`\`\`

## 常用指令

\`\`\`bash
npm run smoke           # 最常用：核心頁面健康檢查
npm run test:login      # 測試登入功能
npm run test:scheduling # 測試排班流程
npm run test:leave      # 測試休假申請 + 審核
npm run test:all        # 跑全部
npm run test:headed     # 打開瀏覽器看操作過程
npm run test:debug      # Debug 模式（逐步執行）
npm run report          # 打開測試報告
npm run codegen         # 錄製操作，自動生成程式碼
\`\`\`

## 切換舊版 / 新版

修改 `tests/helpers/constants.ts`：
- `ACCOUNTS`：帳號密碼
- `SEL`：頁面 selector
- `KNOWN_CHANGES`：新版本已知變更的測試 ID

或直接用環境變數切換 URL：
\`\`\`bash
BASE_URL=http://new-version:8080 npm run test:all
\`\`\`

## Refactor 工作流程

1. 舊版本跑 `npm run test:all`，全部通過 ✅ → baseline 建立
2. 在 `KNOWN_CHANGES` 標記新版本已知會改的流程
3. 切換到新版本，跑 `npm run test:all`
4. 「未標記但失敗」的測試 → Refactor 引入的問題，需要修
5. 「已標記的失敗」→ 預期中的變更，更新腳本
\`\`\`
```

---

## 7. Refactor 工作流程

### 7.1 Phase 1：舊版本建立 Baseline

1. 啟動舊版本 ERP（本地環境）
2. 執行 `npm run codegen`，錄製核心流程
3. 將錄製結果整理到對應的 `.spec.ts` 檔案中
4. 執行 `npm run test:all`，確認全部通過
5. 此時的測試結果就是 baseline

### 7.2 Phase 2：標記已知變更

在開始 Refactor 前，根據需求文件，在 `constants.ts` 的 `KNOWN_CHANGES` 標記哪些流程會改：

```typescript
export const KNOWN_CHANGES = [
  'scheduling-create',            // 排班建立流程重新設計
  'leave-apply',                  // 休假表單簡化
] as const;
```

### 7.3 Phase 3：新版本驗證

1. 切換到新版本 ERP
2. 執行 `npm run smoke`，先確認頁面都能打開
3. 執行 `npm run test:all`，觀察結果
4. 對照結果分類處理：

| 測試結果 | 是否在 KNOWN_CHANGES 中 | 意義 | 行動 |
|---------|----------------------|------|------|
| 通過 ✅ | — | 行為一致 | 不需處理 |
| 失敗 ❌ | 是 | 預期中的變更 | 更新腳本適配新流程 |
| 失敗 ❌ | 否 | Refactor 引入的 bug | 需要修復 |

### 7.4 Phase 4：更新腳本

針對 KNOWN_CHANGES 裡的流程，更新腳本適配新版本：

1. 在新版本上用 `npm run codegen` 重新錄製變更的流程
2. 更新對應的 `.spec.ts` 和 `SEL` 裡的 selector
3. 從 `KNOWN_CHANGES` 移除已更新的項目
4. 再跑一次 `npm run test:all`，全部通過 → 新版本的 baseline 建立

---

## 8. 實施步驟

### 第一天（1-2 小時）

- [ ] 建立 `my-e2e-tests/` 目錄
- [ ] 執行 `npm install` 和 `npx playwright install`
- [ ] 建立 `playwright.config.ts`、`tsconfig.json`、`.gitignore`
- [ ] 建立 `tests/helpers/constants.ts`，填入實際的帳號和 selector
- [ ] 建立 `tests/helpers/auth.ts`
- [ ] 建立 `tests/helpers/navigation.ts`
- [ ] 用 `npm run codegen` 錄製登入流程
- [ ] 完成 `tests/01-login.spec.ts`，跑通

### 第二天（1-2 小時）

- [ ] 完成 `tests/05-smoke.spec.ts`（核心頁面健康檢查），跑通
- [ ] 用 Codegen 錄製排班流程，整理成 `tests/02-scheduling.spec.ts`
- [ ] 跑 `npm run test:all`，確認 baseline 全過

### 第三天（1 小時）

- [ ] 用 Codegen 錄製休假申請流程 → `tests/03-leave.spec.ts`
- [ ] 用 Codegen 錄製休假審核流程 → `tests/04-leave-approve.spec.ts`
- [ ] 跑 `npm run test:all`，全部通過 → baseline 完成

### 之後（每次改功能時）

- [ ] 在 `KNOWN_CHANGES` 標記即將改的流程
- [ ] Refactor 完成後跑 `npm run smoke` → `npm run test:all`
- [ ] 未標記的失敗 → 修 bug
- [ ] 已標記的失敗 → 更新腳本
