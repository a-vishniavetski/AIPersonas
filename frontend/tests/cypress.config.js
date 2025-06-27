import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    specPattern: 'tests/cypress/e2e/**/*.cy.js',
    supportFile: 'tests/cypress/support/e2e.js',
    baseUrl: 'http://localhost:5173',
    screenshotsFolder: 'tests/cypress/screenshots',
  }
});