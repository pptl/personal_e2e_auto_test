---
name: record-flow
description: "錄製 ERP 操作流程並自動生成 Playwright 測試腳本。使用時機：用戶說「錄製 XXX 流程」、「幫我錄製」、「record flow」、「新增測試」。會自動啟動 Playwright codegen、等待用戶錄製完畢、讀取錄製結果並轉換為符合本專案規範的 spec 檔案。"
argument-hint: "要錄製的流程名稱，例如：排班流程、休假申請、打卡流程"
---

# 錄製流程並生成測試腳本

## 用途

當用戶說「錄製 XXX 流程」時，自動執行以下完整流程：
1. 啟動 Playwright codegen 並將輸出存到暫存檔
2. 等待用戶手動操作錄製
3. 讀取錄製結果，轉換為符合本專案規範的 spec 檔案

---

## 步驟

### Step 1 — 啟動錄製

從用戶的訊息中提取流程名稱（例如「排班流程」→ `scheduling`），然後在 terminal 執行：

```bash
npx playwright codegen --output=tests/_recorded.ts http://localhost:3000
```

告知用戶：
> Playwright Inspector 已開啟。請在瀏覽器中完成操作，**錄製完畢後關閉 Inspector 視窗**，然後在這裡輸入「錄製完畢」。

### Step 2 — 等待用戶完成錄製

收到「錄製完畢」後進入下一步。

### Step 3 — 讀取暫存檔

讀取 `tests/_recorded.ts` 的完整內容。

### Step 4 — 分析錄製內容，識別並剝除登入步驟

從錄製內容中，**先找出登入區段並移除**，替換為 `login()` helper。

**登入步驟的識別模式**（以下任一條件符合即為登入步驟）：
- `page.goto(...)` URL 包含 `Login` 或 `login`
- `page.locator('input[name="login--userName"]')` 或類似帳號欄位的操作
- `page.locator('[placeholder="請輸入密碼"]')` 或類似密碼欄位的操作
- 點擊登入按鈕（`button:has-text("登入")` 或 `getByRole('button', { name: '登入' })`）
- 登入後的第一個 `page.goto()` 或 URL 變更（表示登入成功跳轉，也屬於登入流程末端）

**帳號對應 role 的判斷**：
對比 `tests/helpers/constants.ts` 中 `ACCOUNTS` 的 `account` 欄位，找到 `fill()` 填入的值對應哪個 role。

**替換方式**：
```typescript
// 將錄製的登入區段（從 goto /Login 到跳轉完成）整段刪除
// 替換為：
test.use({ storageState: 'tests/.auth/<role>.json' });
// beforeEach 不需要，storageState 會自動帶入已登入狀態
```

從錄製內容中提取：
- **role**：對比 ACCOUNTS 決定（`employee` / `admin` / `manager`）
- **新的 selector**：找出非登入相關的 `page.locator()`、`page.getByRole()`、`page.getByText()` 等
- **操作步驟**：點擊、填寫、選擇等動作
- **頁面 URL**：導航到哪些路徑

### Step 5 — 更新 SEL（如有新 selector）

如果錄製內容包含尚未在 `tests/helpers/constants.ts → SEL` 中的 selector，將它們加入對應的分組（`nav`、`scheduling`、`leave`、`approval`、`common`，或新增分組）。

Selector 轉換原則：
| codegen 原始 | 轉為 SEL 字串 |
|---|---|
| `page.locator('input[name="foo"]')` | `'input[name="foo"]'` |
| `page.getByRole('button', { name: 'X' })` | `'button:has-text("X")'` |
| `page.getByRole('textbox', { name: 'X' })` | `'[placeholder="X"]'` 或 `[aria-label="X"]` |
| `page.getByText('X')` | `'text=X'` |

### Step 6 — 生成 spec 檔案

依照以下規範生成 spec，存為 `tests/<flow-name>.spec.ts`：

```typescript
import { test, expect } from '@playwright/test';
import { navigateTo, expectSuccess } from './helpers/navigation';
import { SEL, isKnownChange } from './helpers/constants';

test.describe('<流程名稱>', () => {
  // storageState 取代登入步驟，不需要 beforeEach login
  test.use({ storageState: 'tests/.auth/<role>.json' });

  test('<測試描述>', async ({ page }) => {
    test.skip(isKnownChange('<flow-id>'), '新版本此流程已變更');

    // 導航（若有點選單的操作）
    await navigateTo(page, SEL.nav.<page>, /<url-pattern>/);

    // 依錄製的操作步驟，使用 SEL 中的 selector
    await page.locator(SEL.<group>.<key>).fill('...');
    await page.locator(SEL.<group>.<key>).click();

    // 驗證成功
    await expectSuccess(page);
  });
});
```

**規範要求**：
- 所有 selector 必須來自 `SEL`，不得 hardcode 在 spec 中
- 登入必須使用 `login(page, role)`，不得重複寫登入步驟
- 導航點選單必須使用 `navigateTo()`
- 成功/失敗訊息必須使用 `expectSuccess()` / `expectError()`
- 不得加入 `test.describe.configure({ mode: 'parallel' })`

### Step 7 — 清理暫存檔

刪除 `tests/_recorded.ts`。

### Step 8 — 回報

告知用戶：
- 新增/修改了哪些 `SEL` 項目
- 生成了哪個 spec 檔案
- 是否有需要手動補充的 TODO（例如驗證步驟、KNOWN_CHANGES 標記）
