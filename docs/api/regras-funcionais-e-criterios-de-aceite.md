# Regras funcionais e critérios de aceite — API do Rotas

Este documento descreve o comportamento da [API ServeRest](https://serverest.dev/) verificado pela suíte de integração do Rotas. Os identificadores `CT` apontam para os cenários automatizados. A [especificação OpenAPI](https://serverest.dev/swagger.json?lang=pt-BR) é a referência para o contrato completo.

## Regras transversais verificadas

- **RF01 — Sessão:** `POST /login` devolve um JWT no campo `authorization` com o prefixo `Bearer ` e validade declarada de 600 segundos (`exp - iat`). A suíte usa esse valor no cabeçalho `Authorization` nas operações protegidas, mas não testa uma requisição após a expiração.
- **RF03 — Criação ou atualização via PUT:** em `PUT /usuarios/{_id}` e `PUT /produtos/{_id}`, dados válidos atualizam um registro existente (`200`); se o identificador não existir, a API cria um novo registro (`201`). O novo registro é consultado pelo `_id` devolvido na resposta, não pelo identificador enviado na URL. A duplicidade de email ou nome, respectivamente, retorna `400`.
- **RF04 — Exclusão de carrinho sem registro:** concluir ou cancelar uma compra sem carrinho ativo para o usuário autenticado retorna `200` com `Não foi encontrado carrinho para esse usuário`.

## Login

Cenários: [login.feature](../../cypress/e2e/features/api/login.feature).

### UC01 — Autenticar usuário · `POST /login`

**Regra funcional:** autenticar com email e senha, distinguindo campos obrigatórios ausentes de credenciais incorretas.

| CT | Critério de aceite |
| --- | --- |
| CT01.1 | Credenciais válidas retornam `200`, `Login realizado com sucesso` e `authorization` conforme RF01. |
| CT01.2 | Um objeto JSON sem `email` e `password` retorna `400` e indica que ambos são obrigatórios. |
| CT01.3, CT01.4 | Um email bem formado não cadastrado ou uma senha incorreta e não vazia para um email cadastrado retorna `401` com a mesma mensagem: `Email e/ou senha inválidos`. |

## Usuários

Cenários: [usuarios.feature](../../cypress/e2e/features/api/usuarios.feature).

### UC02 — Listar usuários · `GET /usuarios`

**Regra funcional:** listar usuários cadastrados e permitir filtrar por um campo.

| CT | Critério de aceite |
| --- | --- |
| CT02.1 | Retorna `200`; `quantidade` corresponde ao tamanho de `usuarios`, e a lista inclui o registro preparado para o cenário. |
| CT02.2 | Cada filtro testado (`_id`, `nome`, `email`, `password` e `administrador`) retorna `200`, inclui o registro esperado e não inclui usuários que não atendem ao filtro. |
| CT02.3 | Um email bem formado e não cadastrado retorna `200`, `quantidade: 0` e `usuarios: []`. |

### UC03 — Cadastrar usuário · `POST /usuarios`

**Regra funcional:** cadastrar usuários comuns e administradores sem reutilizar um email cadastrado.

| CT | Critério de aceite |
| --- | --- |
| CT03.1 | Dados válidos com `administrador` igual à string `"false"` ou `"true"` retornam `201` e `Cadastro realizado com sucesso`; o `_id` retornado permite consultar o cadastro com os dados enviados. |
| CT03.2 | Um email já cadastrado retorna `400` e `Este email já está sendo usado`; permanece apenas o usuário original com esse email. |

### UC04 — Buscar usuário · `GET /usuarios/{_id}`

**Regra funcional:** consultar um usuário pelo identificador.

| CT | Critério de aceite |
| --- | --- |
| CT04.1 | Um `_id` existente retorna `200` e os dados completos do usuário esperado. |
| CT04.2 | Um `_id` inexistente retorna `400` e `Usuário não encontrado`. |

### UC05 — Excluir usuário · `DELETE /usuarios/{_id}`

**Regra funcional:** não excluir usuário com carrinho vinculado.

| CT | Critério de aceite |
| --- | --- |
| CT05.1 | Um usuário sem carrinho é excluído; a resposta é `200` com `Registro excluído com sucesso`, e a consulta posterior não encontra o usuário. |
| CT05.2 | Um usuário com carrinho permanece cadastrado; a resposta é `400` com `Não é permitido excluir usuário com carrinho cadastrado`. |

### UC06 — Editar usuário · `PUT /usuarios/{_id}`

**Regra funcional:** aplicar a RF03 respeitando a unicidade do email.

| CT | Critério de aceite |
| --- | --- |
| CT06.1 | A atualização de um usuário existente retorna `200` e `Registro alterado com sucesso`; a consulta pelo mesmo `_id` devolve os novos dados. |
| CT06.2 | Se o `_id` não existir e o email estiver disponível, retorna `201` e `Cadastro realizado com sucesso`; a consulta pelo `_id` retornado confirma os dados. |
| CT06.3 | Usar o email de outro usuário retorna `400` e `Este email já está sendo usado`; ambos os cadastros permanecem inalterados. |

## Produtos

Cenários: [produtos.feature](../../cypress/e2e/features/api/produtos.feature).

### UC07 — Listar produtos · `GET /produtos`

**Regra funcional:** listar o catálogo sem autenticação e permitir filtrar por um campo.

| CT | Critério de aceite |
| --- | --- |
| CT07.1 | Retorna `200`; `quantidade` corresponde ao tamanho de `produtos`, e a lista inclui o produto preparado para o cenário. |
| CT07.2 | Cada filtro testado (`_id`, `nome`, `preco` e `quantidade`) retorna `200`, inclui o produto esperado e não inclui produtos que não atendem ao filtro. |
| CT07.3 | Um nome sem correspondência retorna `200`, `quantidade: 0` e `produtos: []`. |

### UC08 — Cadastrar produto · `POST /produtos`

**Regra funcional:** permitir que administradores cadastrem produtos sem reutilizar um nome cadastrado.

| CT | Critério de aceite |
| --- | --- |
| CT08.1 | Um administrador envia dados válidos e recebe `201`, `Cadastro realizado com sucesso` e o `_id` que permite consultar o produto criado. |
| CT08.2 | Um nome já cadastrado retorna `400` e `Já existe produto com esse nome`; permanece apenas o produto original com esse nome. |
| CT08.3 | Um token válido de usuário comum retorna `403` e `Rota exclusiva para administradores`; o produto não é criado. |

### UC09 — Buscar produto · `GET /produtos/{_id}`

**Regra funcional:** consultar um produto pelo identificador, sem autenticação.

| CT | Critério de aceite |
| --- | --- |
| CT09.1 | Um `_id` existente retorna `200` e os dados completos do produto esperado. |
| CT09.2 | Um `_id` inexistente retorna `400` e `Produto não encontrado`. |

### UC10 — Excluir produto · `DELETE /produtos/{_id}`

**Regra funcional:** permitir a exclusão por administrador apenas se o produto não estiver vinculado a carrinho.

| CT | Critério de aceite |
| --- | --- |
| CT10.1 | Um administrador exclui um produto sem carrinho vinculado; recebe `200` e `Registro excluído com sucesso`, e a consulta posterior não encontra o produto. |
| CT10.2 | Um produto vinculado a carrinho permanece cadastrado; a resposta é `400` com `Não é permitido excluir produto que faz parte de carrinho`. |
| CT10.3 | Um token válido de usuário comum retorna `403` e `Rota exclusiva para administradores`; o produto permanece cadastrado. |

### UC11 — Editar produto · `PUT /produtos/{_id}`

**Regra funcional:** permitir que administradores apliquem a RF03 respeitando a unicidade do nome.

| CT | Critério de aceite |
| --- | --- |
| CT11.1 | A atualização de um produto existente retorna `200` e `Registro alterado com sucesso`; a consulta pelo mesmo `_id` devolve os novos dados. |
| CT11.2 | Se o `_id` não existir e o nome estiver disponível, retorna `201` e `Cadastro realizado com sucesso`; a consulta pelo `_id` retornado confirma os dados. |
| CT11.3 | Usar o nome de outro produto retorna `400` e `Já existe produto com esse nome`; ambos os produtos permanecem inalterados. |
| CT11.4 | Um token válido de usuário comum retorna `403` e `Rota exclusiva para administradores`; o produto permanece inalterado. |

## Carrinhos

Cenários: [carrinhos.feature](../../cypress/e2e/features/api/carrinhos.feature).

### UC12 — Listar carrinhos · `GET /carrinhos`

**Regra funcional:** listar carrinhos ativos e permitir filtrar por um campo.

| CT | Critério de aceite |
| --- | --- |
| CT12.1 | Retorna `200` com JSON; `quantidade` corresponde ao tamanho de `carrinhos`, e a lista inclui o carrinho preparado para o cenário. |
| CT12.2 | Cada filtro testado (`_id`, `precoTotal`, `quantidadeTotal` e `idUsuario`) retorna `200`, inclui o carrinho esperado e não inclui carrinhos que não atendem ao filtro. |
| CT12.3 | Um `idUsuario` sem correspondência retorna `200`, `quantidade: 0` e `carrinhos: []`. |

### UC13 — Cadastrar carrinho · `POST /carrinhos`

**Regra funcional:** vincular o carrinho ao usuário autenticado e reservar as quantidades dos produtos em estoque.

| CT | Critério de aceite |
| --- | --- |
| CT13.1 | Com estoque suficiente, retorna `201`, `Cadastro realizado com sucesso` e o `_id`. A consulta confirma usuário, itens, preços unitários e quantidades solicitadas. `quantidadeTotal` soma as unidades e `precoTotal` soma os subtotais (`precoUnitario × quantidade`). O estoque diminui pela quantidade reservada de cada produto. |
| CT13.2 | Sem token, retorna `401` com mensagem de autenticação e não cria o carrinho. |
| CT13.3 | A quantidade solicitada acima do estoque retorna `400` e `Produto não possui quantidade suficiente`; o carrinho não é criado e o estoque não muda. |

### UC14 — Buscar carrinho · `GET /carrinhos/{_id}`

**Regra funcional:** consultar a composição e os totais de um carrinho pelo identificador.

| CT | Critério de aceite |
| --- | --- |
| CT14.1 | Um `_id` existente retorna `200`, com identificador, usuário vinculado, itens, quantidades, preços unitários e totais esperados. |
| CT14.2 | Um `_id` inexistente retorna `400` e `Carrinho não encontrado`. |

### UC15 — Concluir compra · `DELETE /carrinhos/concluir-compra`

**Regra funcional:** remover o carrinho do usuário autenticado sem devolver os itens ao estoque.

| CT | Critério de aceite |
| --- | --- |
| CT15.1 | Com carrinho ativo, retorna `200` e `Registro excluído com sucesso`; o carrinho deixa de ser encontrado e a dedução de estoque é mantida. |
| CT15.2 | Sem carrinho ativo, a resposta segue a RF04. |

### UC16 — Cancelar compra · `DELETE /carrinhos/cancelar-compra`

**Regra funcional:** remover o carrinho do usuário autenticado e devolver integralmente as quantidades reservadas ao estoque.

| CT | Critério de aceite |
| --- | --- |
| CT16.1 | Com carrinho ativo, retorna `200` e `Registro excluído com sucesso. Estoque dos produtos reabastecido`; o carrinho deixa de ser encontrado e o estoque de cada produto volta ao valor anterior à reserva. |
| CT16.2 | Sem carrinho ativo, a resposta segue a RF04. |
