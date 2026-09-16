import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Database-backed suites are never collected here. This is what keeps CI
    // off a database — not a runtime skip inside the tests.
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.db.test.ts"],
    server: {
      deps: {
        inline: ["@sudobility/subscription_service"],
      },
    },
  },
});
