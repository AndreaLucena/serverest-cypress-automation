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

### Abrir e interpretar o relatório HTML

Abra o [index.html](./cypress/reports/html/index.html) **no navegador**, não como código no VS Code. No PowerShell, a partir da pasta `serverest-cypress-automation`, rode:

```powershell
Start-Process '.\cypress\reports\html\index.html'
```

O Cucumber grava o resultado dos testes de API em `cypress\reports\cucumber-report.json`. Depois de uma nova execução, rode `npm.cmd run report` novamente, mesmo se algum cenário falhar, e atualize a página no navegador. Se o `index.html` ainda não existir, execute primeiro a suíte de API e depois gere o relatório.

1. No resumo, confira quantos cenários passaram, falharam ou ficaram pendentes.
2. Use **Search features...** para encontrar uma funcionalidade, como **Gerenciamento de Carrinhos de Compra**, e clique no nome para abrir os detalhes.
3. Expanda um cenário para ver os passos `Given`, `When`, `Then` e `And`, com seus resultados e durações. Em caso de falha, comece pela primeira mensagem de erro: os passos seguintes podem não ter sido executados.

Passos ambíguos ou sem definição aparecem como falhas no HTML, sem alterar o resultado original no JSON.

No topo do relatório, **NPM Version** mostra a versão retornada por `npm -v` no momento da geração.

Para investigar falhas, consulte [relatórios](./cypress/reports), [capturas de tela](./cypress/screenshots), [vídeos](./cypress/videos) (quando a gravação estiver habilitada) e [downloads](./cypress/downloads) (quando houver). Apenas os arquivos `.gitkeep` são versionados nessas pastas; os artefatos gerados ficam locais.

### Outras opções de execução

Para abrir a interface do Cypress, use `npm.cmd run cy:open`. Mantenha o [lockfile](./package-lock.json) versionado para que `npm.cmd ci` reproduza a instalação.

A suíte usa `http://127.0.0.1:3000` por padrão. Se a porta estiver ocupada, passe outra ao iniciar o servidor (por exemplo, `npm.cmd run serverest:local -- --porta 3317`) e defina `$env:SERVEREST_URL = 'http://127.0.0.1:3317'` no terminal do Cypress. Use uma instância dedicada a testes.

Para executar apenas a feature de login em modo headless:

```powershell
npm.cmd run cy:run -- --spec "cypress/e2e/features/api/login.feature"
```

No Bash ou em outro shell Unix, use `npm` em vez de `npm.cmd` e `cd` em vez de `Set-Location`. Se precisar trocar a porta, exporte `SERVEREST_URL` no terminal de testes.

## Testes de frontend

Com a API local em execução e acesso à internet, rode `npm.cmd run cy:run:frontend`. A suíte abre a [interface do ServeRest](https://front.serverest.dev/) e encaminha suas chamadas de API para a instância local. O relatório JSON de frontend fica em `cypress/reports/frontend/cucumber-report.json`, separado do relatório de API.

- O cadastro verifica os dados do produto na lista de estoque.
- A exclusão verifica o bloqueio da API e a permanência do produto no estoque. O teste ainda falha na última asserção: a interface atual não exibe a mensagem de bloqueio retornada pela API.
- A reserva de estoque confere duas unidades na Lista de Compras e verifica na API se existe um carrinho ativo vinculado ao cliente e se o estoque caiu de 10 para 8. A interface pública atual não persiste o carrinho na API, então o cenário falha antes da verificação de estoque. A reserva via API é verificada no CT13.1.

## Integração contínua

O workflow [Testes ServeRest](./.github/workflows/testes.yml) roda a cada pull request ou manualmente pela aba **Actions**. Cada job instala as dependências com `npm ci` e aguarda a própria instância local do ServeRest responder antes de executar os testes.

- **API:** executa a suíte completa. Falhas deixam o job vermelho.
- **Regressão de frontend:** executa os cenários sem `@fail`. Falhas deixam o job vermelho.
- **Falhas conhecidas de frontend:** executa apenas os cenários `@fail` (mensagem de exclusão bloqueada e reserva de carrinho). O resultado dos testes não bloqueia a regressão; as asserções continuam sendo executadas.

Na página da execução em **Actions**, baixe os artefatos `resultados-*` para consultar o JSON de cada job e `relatorio-html-api` para visualizar o relatório da API. Os relatórios disponíveis são publicados mesmo quando os testes falham.

## Organização

- [Features de API](./cypress/e2e/features/api): cenários de login, usuários, produtos e carrinhos.
- [Steps de API](./cypress/e2e/step_definitions/api): requisições e asserções por domínio.
- [Suporte de API](./cypress/support/api.js): dados de teste, autenticação e limpeza dos registros criados pela suíte.
- [Page Object da Lista de Compras](./cypress/support/frontend.js): concentra os seletores e as ações da interface; a sequência e as asserções ficam nos steps.

Os cenários usam o ServeRest real. A suíte cria seus próprios dados de teste, sem fixtures, mocks ou dependência de IDs cadastrados previamente.
