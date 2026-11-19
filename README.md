# Rotas — automação de testes da API ServeRest

Suíte de integração da [API ServeRest](https://serverest.dev/) com Cypress, JavaScript e Cucumber. Os cenários BDD cobrem login, usuários, produtos e carrinhos. A estrutura de features, steps e suporte segue como referência o projeto [CIandT](https://github.com/barbaraantonia/CIandT).

- [Regras funcionais e critérios de aceite do Rotas](./docs/api/regras-funcionais-e-criterios-de-aceite.md)
- [Especificação OpenAPI do ServeRest](https://serverest.dev/swagger.json?lang=pt-BR)

## Pré-requisitos

- Node.js 22, 24 ou 26, com npm.
- Git para clonar o repositório.

## Executar no Windows (PowerShell)

```powershell
git clone https://github.com/AndreaLucena/serverest-cypress-automation.git
Set-Location .\serverest-cypress-automation
npm.cmd ci
npm.cmd run serverest:local
```

Mantenha o ServeRest em execução. Em outro terminal, na raiz do repositório, execute:

```powershell
npm.cmd run cy:run:api
npm.cmd run report
```

Abra [o relatório HTML](./cypress/reports/html/index.html). O Cucumber grava o JSON em `cypress\reports\cucumber-report.json`; execute `npm.cmd run report` depois da suíte mesmo se algum cenário falhar para inspecionar os resultados. Para abrir a interface do Cypress, use `npm.cmd run cy:open`.

Para investigar falhas, consulte [relatórios](./cypress/reports), [capturas de tela](./cypress/screenshots), [vídeos](./cypress/videos) (quando a gravação estiver habilitada) e [downloads](./cypress/downloads) (quando houver). Apenas os arquivos `.gitkeep` são versionados nessas pastas; os artefatos gerados ficam locais. Mantenha o [lockfile](./package-lock.json) versionado para que `npm.cmd ci` reproduza a instalação.

A suíte usa `http://127.0.0.1:3000` por padrão. Se a porta estiver ocupada, passe outra ao iniciar o servidor (por exemplo, `npm.cmd run serverest:local -- --porta 3317`) e defina `$env:SERVEREST_URL = 'http://127.0.0.1:3317'` no terminal do Cypress. Use uma instância dedicada a testes.

Para executar apenas a feature de login em modo headless:

```powershell
npm.cmd run cy:run -- --spec "cypress/e2e/features/api/login.feature"
```

No Bash ou em outro shell Unix, use `npm` em vez de `npm.cmd` e `cd` em vez de `Set-Location`. Se precisar trocar a porta, exporte `SERVEREST_URL` no terminal de testes.

## Organização

- [Features de API](./cypress/e2e/features/api): cenários de login, usuários, produtos e carrinhos.
- [Steps de API](./cypress/e2e/step_definitions/api): requisições e asserções por domínio.
- [Suporte de API](./cypress/support/api.js): dados de teste, autenticação e limpeza dos registros criados pela suíte.

Os cenários usam o ServeRest real. A suíte cria seus próprios dados de teste, sem fixtures, mocks ou dependência de IDs cadastrados previamente.
