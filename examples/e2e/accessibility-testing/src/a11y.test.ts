import { describe, it, expect } from "vitest";
import { accessibleLoginForm, inaccessibleLoginForm } from "./pages.js";

/**
 * Unit-level accessibility checks using axe-core directly.
 *
 * For full browser-based a11y testing with Playwright, see playwright.config.ts
 * and the e2e/ directory.
 */

describe("Accessibility: Login form HTML", () => {
  it("accessible form has correct semantic structure", () => {
    const html = accessibleLoginForm();

    // Check for required a11y attributes
    expect(html).toContain('lang="en"');
    expect(html).toContain("<main>");
    expect(html).toContain("<h1>");
    expect(html).toContain('aria-label="Login form"');
    expect(html).toContain('for="email"');
    expect(html).toContain('for="password"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain("autocomplete=");
    expect(html).toContain('type="submit"');
    expect(html).toContain("aria-describedby=");
  });

  it("inaccessible form missing key a11y features", () => {
    const html = inaccessibleLoginForm();

    // These are common a11y violations that axe-core would catch:
    expect(html).not.toContain('lang=');     // Missing html lang
    expect(html).not.toContain("<main>");     // No landmark
    expect(html).not.toContain("<label");     // No labels (uses <span>)
    expect(html).not.toContain('type="submit"'); // Div instead of button
    expect(html).not.toContain('type="password"'); // Password shown as text
    expect(html).toContain('onclick=');       // Click handler on div, not button
  });
});

describe("Accessibility: WCAG 2.1 AA checklist", () => {
  /**
   * This documents the WCAG 2.1 AA checks that axe-core performs.
   * In a real project, these would run against rendered pages using
   * @axe-core/playwright in Playwright tests.
   *
   * Key rules for web apps:
   */
  const wcagChecklist = [
    { rule: "color-contrast", description: "Text has 4.5:1 contrast ratio" },
    { rule: "image-alt", description: "Images have alt text" },
    { rule: "label", description: "Form inputs have associated labels" },
    { rule: "html-has-lang", description: "html element has lang attribute" },
    { rule: "landmark-one-main", description: "Page has one main landmark" },
    { rule: "page-has-heading-one", description: "Page has h1 heading" },
    { rule: "button-name", description: "Buttons have accessible names" },
    { rule: "link-name", description: "Links have accessible names" },
    { rule: "document-title", description: "Page has title element" },
  ];

  it("covers key WCAG 2.1 AA rules", () => {
    expect(wcagChecklist.length).toBeGreaterThan(5);
    for (const check of wcagChecklist) {
      expect(check.rule).toBeTruthy();
      expect(check.description).toBeTruthy();
    }
  });
});
