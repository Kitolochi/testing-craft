import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default: run in Node (jsdom) for fast feedback
    environment: "jsdom",

    // Browser mode config (activate with --browser.enabled flag):
    // browser: {
    //   enabled: true,
    //   provider: "playwright",
    //   name: "chromium",
    //   headless: true,
    //   screenshotDirectory: "__screenshots__",
    // },
  },
});
