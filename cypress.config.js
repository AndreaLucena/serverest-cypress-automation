const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require(
  "@badeball/cypress-cucumber-preprocessor/esbuild",
);

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/features/api/**/*.feature",
    baseUrl: process.env.SERVEREST_URL || "http://127.0.0.1:3000",
    supportFile: false,
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );

      return config;
    },
  },
});
