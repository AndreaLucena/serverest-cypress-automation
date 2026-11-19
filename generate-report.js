const { execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const reportsDirectory = path.join(__dirname, "cypress", "reports");
const reportPath = path.join(reportsDirectory, "html");

function customizeDashboard(npmVersion) {
  const indexPath = path.join(reportPath, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const nodeCard = /(<div class="flex items-center gap-3 min-w-30">\s*<div[^>]*>\s*<i class="fa-brands fa-node-js text-sm"><\/i>[\s\S]*?)(Node Version)(\s*<\/p>\s*<p[^>]*>)[^<]*(<\/p>\s*<\/div>\s*<\/div>)/;
  let updated = html.replace(nodeCard, (card, start, title, valueStart, end) =>
    `${card}\n        ${start.replace("fa-node-js", "fa-npm")}NPM Version${valueStart}${npmVersion}${end}`,
  );
  if (updated === html) {
    throw new Error("O cartão Node Version não foi encontrado no relatório HTML.");
  }

  for (const id of ["device-os-chart", "browser-chart"]) {
    const card = new RegExp(
      `^[ \\t]*<div class="rounded-xl border bg-card text-card-foreground shadow p-6">\\s*<h3[^>]*>[^<]*</h3>\\s*<div id="${id}" class="h-64"></div>\\s*</div>\\r?\\n`,
      "m",
    );
    if (!card.test(updated)) {
      throw new Error(`O cartão ${id} não foi encontrado no relatório HTML.`);
    }
    updated = updated.replace(card, "");
  }
  updated = updated.replace(/(<!-- Analytics Charts -->\s*<div class="grid gap-6) lg:grid-cols-3"/, '$1"');
  fs.writeFileSync(indexPath, updated);
}

function customizeCharts() {
  const chartsPath = path.join(reportPath, "scripts", "charts.js");
  const charts = fs.readFileSync(chartsPath, "utf8");
  const environmentCharts = /^    \/\/ 3\. Device & OS Chart\r?\n[\s\S]*?(?=^    \/\/ 5\. Steps Status Chart)/m;
  if (!environmentCharts.test(charts)) {
    throw new Error("Os gráficos de dispositivo e navegador não foram encontrados no script do relatório.");
  }
  const updated = charts
    .replace(environmentCharts, "")
    .replace(/_loc\('status\.(?:ambiguous|notDefined)','[^']*'\), /g, "")
    .replace(/\b(?:ambiguous|undefined): 0, /g, "")
    .replace(/^[^\r\n]*(?:\bambiguous\b|\bnotDefined\b|\.undefined\b|'undefined')[^\r\n]*\r?\n/gm, "");
  fs.writeFileSync(chartsPath, updated);
}

async function main() {
  const apiReport = path.join(reportsDirectory, "cucumber-report.json");
  if (!fs.existsSync(apiReport)) {
    throw new Error("Execute os testes Cypress antes de gerar o relatório HTML.");
  }

  const npmVersion = execSync("npm -v", { encoding: "utf8" }).trim();
  if (!/^\d+\.\d+\.\d+(?:[-+][\w.+-]+)?$/.test(npmVersion)) {
    throw new Error("Não foi possível identificar a versão do npm no resultado de npm -v.");
  }

  const { generate } = await import("multiple-cucumber-html-reporter");
  const inputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "rotas-report-"));
  try {
    const frontendReport = path.join(reportsDirectory, "frontend", "cucumber-report.json");
    const inputs = [apiReport, ...(fs.existsSync(frontendReport) ? [frontendReport] : [])];
    for (const [index, input] of inputs.entries()) {
      const features = JSON.parse(fs.readFileSync(input, "utf8"));
      for (const feature of features) {
        for (const scenario of feature.elements ?? []) {
          for (const step of scenario.steps ?? []) {
            if (["ambiguous", "undefined"].includes(step.result?.status)) step.result.status = "failed";
          }
        }
      }
      fs.writeFileSync(path.join(inputDirectory, `${index}.json`), JSON.stringify(features));
    }

    await generate({
      jsonDir: inputDirectory,
      reportPath,
      reportName: "Rotas",
      pageTitle: "Automação de testes da API ServeRest",
      metadata: { username: "Andrea Lucena" },
      displayDuration: true,
      customStyle: `
        [class~="bg-status-ambiguous/10"], .status-filter[data-status="ambiguous"],
        [class~="bg-status-undefined/10"], .status-filter[data-status="undefined"] { display: none; }
      `,
    });
    customizeDashboard(npmVersion);
    customizeCharts();
  } finally {
    fs.rmSync(inputDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
