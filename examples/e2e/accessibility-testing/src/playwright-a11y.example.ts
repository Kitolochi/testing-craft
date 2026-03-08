/**
 * Example Playwright + axe-core accessibility test.
 *
 * This file shows how to use @axe-core/playwright in Playwright tests.
 * It's not runnable without playwright test infrastructure, but demonstrates
 * the pattern for integrating axe-core into e2e tests.
 *
 * To use in your project:
 * 1. npm install @axe-core/playwright @playwright/test
 * 2. Create a playwright.config.ts
 * 3. Copy this pattern into your test files
 */

// import { test, expect } from "@playwright/test";
// import AxeBuilder from "@axe-core/playwright";

/*
test.describe("Accessibility", () => {
  test("login page passes WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    // Detailed violation reporting
    for (const violation of results.violations) {
      console.log(`[${violation.impact}] ${violation.id}: ${violation.description}`);
      for (const node of violation.nodes) {
        console.log(`  Target: ${node.target}`);
        console.log(`  HTML: ${node.html}`);
      }
    }

    expect(results.violations).toEqual([]);
  });

  test("navigation is keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Check skip link
    await page.keyboard.press("Tab");
    const skipLink = page.locator('[href="#main-content"]');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      const mainContent = page.locator("#main-content");
      await expect(mainContent).toBeFocused();
    }
  });

  test("color contrast meets AA standards", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
*/
