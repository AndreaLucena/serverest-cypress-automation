# serverest-cypress-automation

Suíte de integração da API ServeRest com Cypress, JavaScript e Cucumber. A estrutura de features, steps e suporte segue como referência o projeto [CIandT](https://github.com/barbaraantonia/CIandT).

## Executar no Windows

Use Node.js 22, 24 ou 26 e npm. Na raiz do projeto:

```powershell
npm.cmd ci
npm.cmd run serverest:local
```

Mantenha o ServeRest em execução e, em outro terminal, execute:

```powershell
npm.cmd run cy:run:api
npm.cmd run report
```

Abra [o relatório HTML](./cypress/reports/html/index.html). O Cucumber grava o JSON em `cypress\reports\cucumber-report.json`; execute `npm.cmd run report` depois da suíte mesmo se algum cenário falhar para inspecionar os resultados. Para abrir a interface do Cypress, use `npm.cmd run cy:open`.

Relatórios e outros artefatos do Cypress são gerados localmente e não devem ser incluídos no commit. Não é preciso criar a pasta de relatórios antes da primeira execução. Mantenha o [lockfile](./package-lock.json) versionado para que `npm.cmd ci` reproduza a instalação.

A suíte usa `http://127.0.0.1:3000` por padrão. Se a porta estiver ocupada, passe outra ao iniciar o servidor (por exemplo, `npm.cmd run serverest:local -- --porta 3317`) e defina `$env:SERVEREST_URL = 'http://127.0.0.1:3317'` no terminal do Cypress. Use uma instância dedicada a testes.

## Organização

- [Features de API](./cypress/e2e/features/api): cenários de login, usuários, produtos e carrinhos.
- [Steps de API](./cypress/e2e/step_definitions/api): requisições e asserções por domínio.
- [Suporte de API](./cypress/support/api.js): dados de teste, autenticação e limpeza dos registros criados pela suíte.

Os cenários usam o ServeRest real. A suíte cria seus próprios dados de teste, sem fixtures, mocks ou dependência de IDs cadastrados previamente.
