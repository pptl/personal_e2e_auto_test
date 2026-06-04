# ERP 個人 E2E 測試工具

Refactor 安全網：在舊版本建立 baseline，新版本跑同一套腳本驗證行為一致。

## 安裝

```bash
npm install
npx playwright install
```

## 常用指令

```bash
npm run smoke           # 最常用：核心頁面健康檢查
npm run test:login      # 測試登入功能
npm run test:scheduling # 測試排班流程
npm run test:leave      # 測試休假申請 + 審核
npm run test:all        # 跑全部
npm run test:headed     # 打開瀏覽器看操作過程
npm run test:debug      # Debug 模式（逐步執行）
npm run report          # 打開測試報告
npm run codegen         # 錄製操作，自動生成程式碼
```

## 切換舊版 / 新版

修改 `tests/helpers/constants.ts`：
- `ACCOUNTS`：帳號密碼
- `SEL`：頁面 selector
- `KNOWN_CHANGES`：新版本已知變更的測試 ID

或直接用環境變數切換 URL：
```bash
BASE_URL=http://new-version:8080 npm run test:all
```

## Refactor 工作流程

1. 舊版本跑 `npm run test:all`，全部通過 ✅ → baseline 建立
2. 在 `KNOWN_CHANGES` 標記新版本已知會改的流程
3. 切換到新版本，跑 `npm run test:all`
4. 「未標記但失敗」的測試 → Refactor 引入的問題，需要修
5. 「已標記的失敗」→ 預期中的變更，更新腳本
