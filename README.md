🚀 Automação de Testes da API ServeRest

Este projeto contém uma suíte de testes automatizados da API ServeRest, desenvolvida com Cypress, JavaScript e Cucumber (BDD).

A ServeRest é uma API REST gratuita que simula um ambiente de e-commerce e foi criada para fins educacionais, sendo amplamente utilizada para estudos e práticas de testes de software.

📋 Sobre este projeto
As regras funcionais e critérios de aceite utilizados na automação podem ser consultados em: ./docs/api/regras-funcionais-e-criterios-de-aceite.md

📌 Pré-requisitos

Antes de executar o projeto, certifique-se de possuir:
- Node.js 22, 24 ou 26
- npm
- Git

▶️ Execução local (Windows / PowerShell)
1. Clonar o repositório:
git clone https://github.com/AndreaLucena/serverest-cypress-automation.git
Set-Location .\serverest-cypress-automation
2. Instalar as dependências:
npm.cmd ci
3. Iniciar o ServeRest local:
npm.cmd run serverest:local

⚠️ Mantenha o ServeRest em execução durante toda a execução da suíte.
5. Executar os testes de API
Abra um novo terminal na raiz do projeto e execute:
npm.cmd run cy:run:api
npm.cmd run report

📊 Relatórios
Após a execução dos testes, um relatório HTML será gerado.
Abrir o relatório:
Start-Process '.\cypress\reports\html\index.html'

⚠️ Abra o arquivo no navegador. A visualização do código-fonte no VS Code não exibe o relatório corretamente.

Gerando novamente o relatório
O Cucumber salva os resultados em:
cypress/reports/cucumber-report.json

Após uma nova execução dos testes, gere novamente o relatório:
npm.cmd run report

⚙️ Outras opções de execução
Abrir a interface do Cypress
npm.cmd run cy:open
Executar apenas a feature de Login:
npm.cmd run cy:run -- --spec "cypress/e2e/features/api/login.feature"

Instalação reproduzível
Mantenha o arquivo abaixo versionado no repositório:
package-lock.json

Isso garante que o comando:
PowerShell
npm.cmd ci
reproduza exatamente as versões utilizadas pela suíte.

🌐 Configuração da URL da API

Por padrão, a suíte utiliza:
http://127.0.0.1:3000

Caso a porta esteja ocupada, inicie uma nova instância em outra porta:
npm.cmd run serverest:local -- --porta 3317

Em seguida, configure a variável de ambiente:
$env:SERVEREST_URL = 'http://127.0.0.1:3317'
Recomenda-se utilizar uma instância exclusiva para execução dos testes.

🖥️ Testes de Frontend
Com a API local em execução e acesso à internet disponível, execute:
npm.cmd run cy:run:frontend
A suíte acessa:
https://front.serverest.dev/
e redireciona as chamadas da API para a instância local da ServeRest.

Os resultados são armazenados em:
cypress/reports/frontend/cucumber-report.json
Esse relatório é mantido separadamente da suíte de API.

🔄 Integração Contínua
O workflow:
.github/workflows/testes.yml
É executado:
- A cada Pull Request;
- Manualmente pela aba Actions do GitHub.

Cada job:
1. Instala as dependências com npm ci;
2. Inicializa uma instância própria do ServeRest;
3. Aguarda a API ficar disponível;
4. Executa a suíte correspondente.

Jobs disponíveis:

✅ API
Executa toda a suíte de testes de API.
Falhas tornam o job vermelho.

✅ Regressão de Frontend
Executa apenas cenários sem a tag @fail.
Falhas tornam o job vermelho.

⚠️ Falhas Conhecidas de Frontend
Executa exclusivamente os cenários marcados com:
@fail
Inclui:
- Mensagem de exclusão bloqueada;
- Reserva de carrinho.
As falhas não bloqueiam a regressão principal, mas continuam sendo verificadas e registradas.

Artefatos publicados
Na página da execução do workflow, na aba Actions, é possível baixar:
- Resultados individuais:
resultados-*
Contêm os relatórios em JSON gerados por cada job.

- Relatório HTML da API:
relatorio-html-api
Permite visualizar os resultados em formato HTML.
Os artefatos são publicados mesmo quando os testes apresentam falhas.

🌐 Suporte API
cypress/support/api.js
Centraliza:
- Dados de teste;
- Autenticação;
- Limpeza automática dos registros criados pela suíte.

🖥️ Page Object do Frontend
cypress/support/frontend.js
Concentra:
- Seletores da interface;
- Ações executadas pelo usuário.
As regras de negócio e validações permanecem nos arquivos de step definitions.
