# ERP E2E Auto Test — Agent Instructions

Personal Playwright E2E test suite for an ERP system (Spring Boot + React). Purpose: record a baseline on the old version, then run the same tests after refactoring to catch regressions.

## Project Structure

```
my-e2e-tests/
├── tests/
│   ├── helpers/
│   │   ├── constants.ts   ← accounts, selectors (SEL), KNOWN_CHANGES, CORE_PAGES
│   │   ├── auth.ts        ← login(page, role) / logout(page)
│   │   └── navigation.ts  ← navigateTo(), expectSuccess(), expectError()
│   ├── login.spec.ts
│   ├── scheduling.spec.ts
│   ├── leave.spec.ts
│   ├── leave-approve.spec.ts
│   └── smoke.spec.ts   ← most important; run this first after refactor
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

See [prd-personal-playwright .md](./prd-personal-playwright%20.md) for the full spec, all file templates, and the refactor workflow.

## Commands

```bash
npm run smoke           # core-page health check — run first after every refactor
npm run test:login      # login tests
npm run test:scheduling # scheduling tests
npm run test:leave      # leave + approval tests
npm run test:all        # full suite
npm run test:headed     # show browser
npm run test:debug      # step-through debugger
npm run codegen         # record interactions → generate test code
npm run report          # open HTML report
BASE_URL=http://new-version:8080 npm run test:all  # target a different environment
```

Install: `npm install && npx playwright install`

## Key Conventions

### Centralized selectors — always use SEL
All CSS/text selectors live in `tests/helpers/constants.ts → SEL`. Never hardcode selectors inside spec files. When the ERP UI changes, update `SEL` once.

```typescript
import { SEL } from './helpers/constants';
await page.locator(SEL.login.account).fill(account);
```

### Role-based login — always use login()
```typescript
import { login } from './helpers/auth';
await login(page, 'manager'); // roles: manager | employee | admin | hr
```

### KNOWN_CHANGES — skip expected failures during refactor
When a flow is intentionally redesigned, add its test ID to `KNOWN_CHANGES` in `constants.ts` so it skips instead of failing:
```typescript
export const KNOWN_CHANGES = [
  'scheduling-create',
] as const;

// In spec:
test.skip(isKnownChange('scheduling-create'), 'New version changes this flow');
```

### Config defaults
- `baseURL`: `http://localhost:8080` (override with `BASE_URL` env var)
- `workers: 1`, `fullyParallel: false` — tests run sequentially (login state)
- `retries: 0` — failures surface immediately; no flaky suppression
- Screenshots, video, trace: `retain-on-failure` only

## Refactor Workflow (short version)

1. Old version: `npm run test:all` → all pass = baseline
2. Add expected changes to `KNOWN_CHANGES`
3. New version: `npm run smoke` → `npm run test:all`
4. **Unmarked failures** = bugs introduced by refactor → fix the ERP code
5. **Marked failures** = expected → update the spec + selector, then remove from `KNOWN_CHANGES`
