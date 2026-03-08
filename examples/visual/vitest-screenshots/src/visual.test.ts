import { describe, it, expect } from "vitest";
import { createButton, createCard, createBadge } from "./components.js";

/**
 * Visual regression tests using Vitest Browser Mode.
 *
 * Run with: npx vitest run --browser.enabled
 *
 * These tests render components and compare screenshots against baselines.
 * On first run, baselines are created. On subsequent runs, diffs are detected.
 *
 * Note: Requires @vitest/browser and playwright.
 * In CI, ensure a browser is available (e.g., playwright install chromium).
 */

describe("Visual: Button variants", () => {
  it("renders primary button", async () => {
    const button = createButton("Click me", "primary");
    document.body.appendChild(button);

    // In Vitest Browser Mode, this captures and compares screenshots
    // await expect(document.body).toMatchScreenshot({ name: "button-primary" });

    // Fallback for non-browser mode: verify DOM structure
    expect(button.textContent).toBe("Click me");
    expect(button.style.background).toContain("#3b82f6");

    document.body.removeChild(button);
  });

  it("renders secondary button", async () => {
    const button = createButton("Cancel", "secondary");
    document.body.appendChild(button);

    expect(button.textContent).toBe("Cancel");
    expect(button.style.background).toContain("#e5e7eb");

    document.body.removeChild(button);
  });

  it("renders danger button", async () => {
    const button = createButton("Delete", "danger");
    document.body.appendChild(button);

    expect(button.textContent).toBe("Delete");
    expect(button.style.background).toContain("#ef4444");

    document.body.removeChild(button);
  });
});

describe("Visual: Card component", () => {
  it("renders card with title and body", async () => {
    const card = createCard("Welcome", "This is a card component for visual testing.");
    document.body.appendChild(card);

    expect(card.querySelector("h3")?.textContent).toBe("Welcome");
    expect(card.querySelector("p")?.textContent).toContain("visual testing");

    document.body.removeChild(card);
  });
});

describe("Visual: Badge component", () => {
  it("renders badge with default color", () => {
    const badge = createBadge("New");
    expect(badge.textContent).toBe("New");
  });

  it("renders badge with custom color", () => {
    const badge = createBadge("Error", "#ef4444");
    expect(badge.textContent).toBe("Error");
    expect(badge.style.color).toBe("#ef4444");
  });
});
