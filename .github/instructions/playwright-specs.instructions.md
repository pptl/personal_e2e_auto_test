---
applyTo: "tests/**/*.spec.ts"
---

## Writing Playwright Specs in This Project

- **Always** import selectors from `helpers/constants.ts → SEL`; never hardcode CSS or text selectors in spec files.
- **Always** use `login(page, role)` from `helpers/auth.ts` for authentication; call it in `test.beforeEach`.
- Use `navigateTo()`, `expectSuccess()`, `expectError()` from `helpers/navigation.ts` instead of ad-hoc `page.goto` + `expect` patterns.
- For flows that will change in a refactor, add the test ID to `KNOWN_CHANGES` and call `test.skip(isKnownChange('id'), reason)` at the start of the test.
- Spec file naming: `NN-topic.spec.ts` (two-digit prefix keeps execution order deterministic).
- Smoke test (`05-smoke.spec.ts`) must remain free of functional assertions — it only checks page load + zero JS errors.
- `workers: 1` and `fullyParallel: false` are intentional — do not add `test.describe.configure({ mode: 'parallel' })`.
