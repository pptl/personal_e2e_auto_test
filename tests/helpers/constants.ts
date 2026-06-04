// tests/helpers/constants.ts

// ──────────────────────────────
// 測試帳號
// ──────────────────────────────
export const ACCOUNTS = {
  manager: {
    account: 'mgr-001',
    password: 'Test1234!',
    displayName: '主管A',
    redirectUrl: 'dashboard',
  },
  employee: {
    account: 'Alen.Chua',
    password: 'Alen.Chua',
    displayName: '員工A',
    redirectUrl: 'dashboard',
  },
  admin: {
    account: 'ESDNETADMIN',
    password: 'ESDNETADMIN',
    displayName: '管理員A',
    redirectUrl: 'dashboard',
  },
/*   hr: {
    account: 'hr-001',
    password: 'Test1234!',
    displayName: 'HR A',
    redirectUrl: 'dashboard',
  }, */
} as const;

export type Role = keyof typeof ACCOUNTS;

// ──────────────────────────────
// Selector 集中管理
// 舊版 → 新版切換時，只需要改這裡
// ──────────────────────────────
export const SEL = {
  // 登入頁
  login: {
    account: 'input[name="login--userName"]',
    password: '[placeholder="請輸入密碼"]',
    submitBtn: 'button:has-text("登入")',
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
  // 'scheduling-create',
  // 'leave-apply',
] as const;

export function isKnownChange(testId: string): boolean {
  return KNOWN_CHANGES.includes(testId as never);
}
