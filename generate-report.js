const fs = require("node:fs");
const path = require("node:path");
const reporter = require("multiple-cucumber-html-reporter");

const reportsDirectory = path.join(__dirname, "cypress", "reports");
const jsonReports = fs
  .readdirSync(reportsDirectory)
  .filter((file) => file.toLowerCase().endsWith(".json"));

if (jsonReports.length === 0) {
  throw new Error(
    `Nenhum relatório JSON encontrado em ${reportsDirectory}. Execute os testes Cypress antes de gerar o relatório.`,
  );
}

reporter.generate({
  jsonDir: reportsDirectory,
  reportPath: path.join(reportsDirectory, "html"),
  reportName: "Relatório de testes Cypress",
  pageTitle: "Relatório de testes Cypress",
  displayDuration: true,
});
