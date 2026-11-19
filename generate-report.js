const fs = require("node:fs");
const path = require("node:path");
const reportsDirectory = path.join(__dirname, "cypress", "reports");

async function main() {
  if (!fs.existsSync(path.join(reportsDirectory, "cucumber-report.json"))) {
    throw new Error("Execute os testes Cypress antes de gerar o relatório HTML.");
  }

  const { generate } = await import("multiple-cucumber-html-reporter");
  await generate({
    jsonDir: reportsDirectory,
    reportPath: path.join(reportsDirectory, "html"),
    reportName: "Rotas — testes de API",
    pageTitle: "Rotas — testes de API",
    displayDuration: true,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
