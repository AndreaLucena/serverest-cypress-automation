🚀 Automação de Testes da API ServeRest

Este projeto contém uma suíte de testes automatizados da API ServeRest, desenvolvida com Cypress, JavaScript e Cucumber (BDD).

A ServeRest é uma API REST gratuita que simula um ambiente de e-commerce e foi criada para fins educacionais, sendo amplamente utilizada para estudos e práticas de testes de software.

💙 Gostou da iniciativa? Considere apoiar o projeto original:

Autor: <https://github.com/PauloGoncalvesBH>
Repositório oficial: <https://github.com/ServeRest/ServeRest>
Documentação Swagger: <https://serverest.dev/swagger?lang=pt-BR>

📋 Sobre este projeto

A suíte automatiza cenários de integração da API ServeRest e valida funcionalidades relacionadas a:

- Autenticação
- Usuários
- Produtos
- Carrinhos de compra

Os testes são executados diretamente contra uma instância real da API, sem utilização de mocks ou fixtures.

📖 Regras de negócio

As regras funcionais e critérios de aceite utilizados na automação podem ser consultados em:
[Regras funcionais e critérios de aceite do Rotas](./docs/api/regras-funcionais-e-criterios-de-aceite.md)

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

4. Executar os testes de API

Abra um novo terminal na raiz do projeto e execute:
npm.cmd run cy:run:api
npm.cmd run report

📊 Relatórios

Após a execução dos testes, um relatório HTML será gerado.
Abrir o relatório:
Start-Process '.\cypress\reports\html\index.html'
⚠️ Abra o arquivo no navegador. A visualização do código-fonte no VS Code não exibe o relatório corretamente.

Como interpretar o relatório

O relatório permite:

✅ Consultar cenários aprovados, falhos e pendentes

✅ Pesquisar funcionalidades específicas utilizando o campo Search features...

✅ Visualizar detalhes de cada cenário

✅ Analisar os passos Given, When, Then e And

✅ Consultar tempos de execução e mensagens de erro

Exemplo de análise:
1. Consulte o resumo geral para identificar quantos cenários foram executados.
2. Utilize o campo Search features... para localizar uma funcionalidade específica, como Gerenciamento de Carrinhos de Compra.
3. Clique na funcionalidade desejada para expandir seus cenários.
4. Abra um cenário para visualizar:
  . Passos executados
  . Resultado de cada passo
  . Duração da execução
  . Mensagens de erro, quando houver

💡 Em caso de falha, analise primeiro a primeira mensagem de erro. Os passos posteriores podem não ter sido executados.

Gerando novamente o relatório
O Cucumber salva os resultados em:
cypress/reports/cucumber-report.json

Após uma nova execução dos testes, gere novamente o relatório:
npm.cmd run report
Mesmo que existam falhas na execução, o comando de geração do relatório deve ser executado.
Se o arquivo HTML ainda não existir, execute primeiro a suíte de testes e somente depois gere o relatório.

Informações adicionais do relatório
Passos ambíguos ou sem implementação aparecem como falhas no HTML.
O resultado original do JSON permanece inalterado.
O campo NPM Version exibe a versão retornada pelo comando:
npm -v

🔍 Artefatos para análise de falhas

Para investigação de problemas, consulte os seguintes diretórios:

Tipo	Diretório
Relatórios	cypress/reports
Capturas de tela	cypress/screenshots
Vídeos	cypress/videos
Downloads	cypress/downloads

Apenas os arquivos .gitkeep são versionados. Os artefatos gerados durante os testes permanecem apenas no ambiente local.

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

🐧 Execução em Linux/macOS
Substitua os comandos específicos do PowerShell pelos equivalentes do sistema:
Windows	Linux/macOS
npm.cmd	npm
Set-Location	cd
Caso seja necessário alterar a URL da API, exporte a variável SERVEREST_URL antes da execução dos testes.

🖥️ Testes de Frontend

Com a API local em execução e acesso à internet disponível, execute:
npm.cmd run cy:run:frontend
A suíte acessa:
https://front.serverest.dev/
e redireciona as chamadas da API para a instância local da ServeRest.

Os resultados são armazenados em:
cypress/reports/frontend/cucumber-report.json
Esse relatório é mantido separado da suíte de API.

Cenários implementados:

1. Cadastro de produtos - Valida:
- Dados cadastrados exibidos corretamente na lista de estoque.

2. Exclusão de produtos - Valida:
- Bloqueio da exclusão pela API;
- Permanência do produto no estoque.
⚠️ Atualmente, o cenário falha na última validação porque a interface pública não exibe a mensagem de bloqueio retornada pela API.

3. Reserva de estoque - Valida:
- Inclusão de duas unidades na Lista de Compras;
- Existência de um carrinho ativo vinculado ao cliente;
- Redução do estoque de 10 para 8 unidades.
⚠️ Atualmente, o cenário falha antes da validação de estoque porque a interface pública não persiste o carrinho na API.
A reserva realizada diretamente pela API é validada no caso de teste CT13.1.

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
Contêm os relatórios JSON gerados por cada job.

- Relatório HTML da API:
relatorio-html-api
Permite visualizar os resultados em formato HTML.
Os artefatos são publicados mesmo quando os testes apresentam falhas.

📂 Organização do Projeto
Features API
cypress/e2e/features/api

Contém os cenários de:
- Login
- Usuários
- Produtos
- Carrinhos

Steps API
cypress/e2e/step_definitions/api
Implementa as requisições e validações de cada domínio da aplicação.

Suporte API
cypress/support/api.js
Centraliza:
- Dados de teste;
- Autenticação;
- Limpeza automática dos registros criados pela suíte.

Page Object do Frontend
cypress/support/frontend.js
Concentra:
- Seletores da interface;
- Ações executadas pelo usuário.
As regras de negócio e validações permanecem nos arquivos de step definitions.

✅ Estratégia de Testes
Os cenários são executados contra uma instância real do ServeRest.

A suíte:
- Cria seus próprios dados de teste;
- Não utiliza fixtures;
- Não utiliza mocks;
- Não depende de IDs previamente cadastrados;
- Realiza limpeza dos dados gerados durante a execução.
Isso torna os testes mais independentes, reproduzíveis e próximos do comportamento real da aplicação.
