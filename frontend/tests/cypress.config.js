import {defineConfig} from "cypress";

export default defineConfig({
  clientCertificates: [
    {
      url: 'https://localhost:5173',
      certs: [
        {
          cert: '../backend/env/cert.pem',
          key: '../backend/env/key.pem'
        }]
    }],
  e2e: {
    specPattern: 'tests/cypress/e2e/*.cy.js',
    supportFile: false,
    baseUrl: 'https://localhost:5173',
    chromeWebSecurity: false,
    screenshotsFolder: 'tests/cypress/screenshots',
  }
});