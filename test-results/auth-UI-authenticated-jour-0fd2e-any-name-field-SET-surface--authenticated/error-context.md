# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> UI authenticated journeys >> UI-TC-0012 settings page shows company name field (SET surface)
- Location: e2e\auth.spec.ts:45:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#company_name')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('#company_name')

```

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- heading "Frosty" [level=1]
- paragraph: Merchant Operations Workspace
- text: Email Address
- textbox "Email Address":
  - /placeholder: merchant@company.com
- text: Password
- button "Forgot password?"
- textbox "Password":
  - /placeholder: ••••••••
- button "Show password": visibility_off
- button "Sign In to Workspace arrow_forward"
- paragraph:
  - text: Don't have a merchant account?
  - link "Sign up":
    - /url: /signup
- paragraph: verified_user Secure Operational Environment
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import fs from "fs";
  3  | import path from "path";
  4  | 
  5  | const AUTH_FILE = path.join(__dirname, ".auth/user.json");
  6  | 
  7  | function hasAuth(): boolean {
  8  |   const email = process.env.E2E_EMAIL?.trim();
  9  |   const password = process.env.E2E_PASSWORD?.trim();
  10 |   if (!email || !password) return false;
  11 |   try {
  12 |     const raw = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8")) as {
  13 |       cookies?: unknown[];
  14 |       origins?: unknown[];
  15 |     };
  16 |     return (raw.cookies?.length ?? 0) > 0 || (raw.origins?.length ?? 0) > 0;
  17 |   } catch {
  18 |     return false;
  19 |   }
  20 | }
  21 | 
  22 | test.describe("UI authenticated journeys", () => {
  23 |   test.beforeEach(({ }, testInfo) => {
  24 |     if (!hasAuth()) {
  25 |       testInfo.skip(true, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated UI tests");
  26 |     }
  27 |   });
  28 | 
  29 |   test("UI-TC-0010 home loads after session", async ({ page }) => {
  30 |     await page.goto("/home");
  31 |     await expect(page).not.toHaveURL(/\/login/);
  32 |     // Shell should render somewhere past login
  33 |     await expect(page.locator("body")).toBeVisible();
  34 |   });
  35 | 
  36 |   test("UI-TC-0011 inbox page opens (Y1 surface)", async ({ page }) => {
  37 |     await page.goto("/inbox");
  38 |     await expect(page).not.toHaveURL(/\/login/);
  39 |     // Title / waiting tab from inbox UI
  40 |     await expect(
  41 |       page.getByText(/waiting|inbox|claim|the agent is handling/i).first(),
  42 |     ).toBeVisible({ timeout: 30_000 });
  43 |   });
  44 | 
  45 |   test("UI-TC-0012 settings page shows company name field (SET surface)", async ({
  46 |     page,
  47 |   }) => {
  48 |     await page.goto("/settings");
  49 |     await expect(page).not.toHaveURL(/\/login/);
> 50 |     await expect(page.locator("#company_name")).toBeVisible({ timeout: 30_000 });
     |                                                 ^ Error: expect(locator).toBeVisible() failed
  51 |   });
  52 | 
  53 |   test("UI-TC-0013 team page is reachable", async ({ page }) => {
  54 |     await page.goto("/team");
  55 |     await expect(page).not.toHaveURL(/\/login/);
  56 |     await expect(page.locator("body")).toBeVisible();
  57 |   });
  58 | });
  59 | 
```