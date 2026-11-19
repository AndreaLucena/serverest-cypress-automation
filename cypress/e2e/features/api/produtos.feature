Feature: Gerenciamento de Produtos

# UC07 - Listar Produtos (GET /produtos)
  Scenario: CT07.1 - Listar produtos disponíveis
    Given que existem produtos cadastrados no catálogo
    When o consumidor envia uma requisição GET para /produtos
    Then a resposta deve ter status 200
    And o corpo deve conter a quantidade de produtos retornados
    And a lista deve conter os produtos cadastrados

  Scenario Outline: CT07.2 - Filtrar produtos por um campo
    Given que existe um produto cadastrado com o valor "<valor>" no campo "<campo>"
    When o consumidor envia uma requisição GET para /produtos filtrando por "<campo>" com o valor "<valor>"
    Then a resposta deve ter status 200
    And todos os produtos retornados devem corresponder ao filtro "<campo>" com valor "<valor>"

    Examples:
      | campo      | valor                        |
      | _id        | GCNxBhA82H3MQizf             |
      | nome       | Produto QA 1795045537428-6138|
      | preco      | 289                          |
      | quantidade | 1                            |

  Scenario: CT07.3 - Listar produtos sem resultados para o filtro informado
    Given que não existe produto com o valor "inexistente" no campo "nome"
    When o consumidor envia uma requisição GET para /produtos filtrando por "nome" com o valor "inexistente"
    Then a resposta deve ter status 200
    And a quantidade de produtos retornados deve ser 0
    And a lista de produtos deve estar vazia

# UC08 - Cadastrar Produto (POST /produtos)
  Scenario: CT08.1 - Cadastrar produto com token de administrador
    Given que o usuário está autenticado com perfil de administrador
    And não existe produto cadastrado com o nome "Produto Novo BDD"
    When o usuário envia uma requisição POST para /produtos com nome, preco, descricao e quantidade
    Then a resposta deve ter status 201
    And a mensagem deve indicar que o cadastro foi realizado com sucesso
    And o corpo deve conter o identificador do novo produto
    And o produto deve estar disponível no catálogo

  Scenario: CT08.2 - Impedir cadastro de produto com nome já utilizado
    Given que o usuário está autenticado com perfil de administrador
    And existe um produto cadastrado com o nome "Produto Existente BDD"
    When o usuário tenta cadastrar outro produto com o mesmo nome
    Then a resposta deve ter status 400
    And a mensagem deve ser "Já existe produto com esse nome"
    And nenhum novo produto deve ser cadastrado

  Scenario: CT08.3 - Impedir cadastro por usuário sem perfil de administrador
    Given que o usuário está autenticado sem perfil de administrador
    When ele envia uma requisição POST para /produtos com dados válidos
    Then a resposta deve ter status 403
    And a mensagem deve ser "Rota exclusiva para administradores"
    And nenhum produto deve ser cadastrado

# UC09 - Buscar Produto por ID (GET /produtos/{_id})
  Scenario: CT09.1 - Buscar produto existente pelo identificador
    Given que existe um produto cadastrado com um identificador conhecido
    When o consumidor envia uma requisição GET para /produtos/{_id} com esse identificador
    Then a resposta deve ter status 200
    And o corpo deve conter os dados completos do produto solicitado

  Scenario: CT09.2 - Buscar produto inexistente pelo identificador
    Given que não existe produto com o identificador informado
    When o consumidor envia uma requisição GET para /produtos/{_id} com esse identificador
    Then a resposta deve ter status 400
    And a resposta deve indicar que o produto não foi encontrado

# UC10 - Excluir Produto (DELETE /produtos/{_id})
  Scenario: CT10.1 - Excluir produto sem vínculo com carrinho ativo
    Given que o usuário está autenticado com perfil de administrador
    And existe um produto que não está vinculado a carrinho ativo
    When o usuário envia uma requisição DELETE para /produtos/{_id} com o identificador desse produto
    Then a resposta deve ter status 200
    And a resposta deve indicar que o registro foi excluído com sucesso
    And o produto não deve mais ser encontrado pelo identificador

  Scenario: CT10.2 - Impedir exclusão de produto vinculado a carrinho
    Given que o usuário está autenticado com perfil de administrador
    And existe um produto que faz parte de um carrinho
    When o usuário envia uma requisição DELETE para /produtos/{_id} com o identificador desse produto
    Then a resposta deve ter status 400
    And a mensagem deve ser "Não é permitido excluir produto que faz parte de carrinho"
    And o produto deve continuar cadastrado

  Scenario: CT10.3 - Impedir exclusão por usuário sem perfil de administrador
    Given que o usuário está autenticado sem perfil de administrador
    And existe um produto que não está vinculado a carrinho ativo
    When o usuário envia uma requisição DELETE para /produtos/{_id} com o identificador desse produto
    Then a resposta deve ter status 403
    And a mensagem deve ser "Rota exclusiva para administradores"
    And o produto deve continuar cadastrado

# UC11 - Editar Produto (PUT /produtos/{_id})
  Scenario: CT11.1 - Atualizar produto existente
    Given que o usuário está autenticado com perfil de administrador
    And existe um produto cadastrado com dados conhecidos
    When o usuário envia uma requisição PUT para /produtos/{_id} com novos dados válidos e um nome exclusivo
    Then a resposta deve ter status 200
    And a resposta deve indicar que o registro foi alterado com sucesso
    And uma consulta pelo identificador deve retornar os novos dados do produto

  Scenario: CT11.2 - Criar produto quando o identificador não existe
    Given que o usuário está autenticado com perfil de administrador
    And não existe produto com o identificador informado
    And o nome enviado ainda não está cadastrado
    When o usuário envia uma requisição PUT para /produtos/{_id} com nome, preco, descricao e quantidade
    Then a resposta deve ter status 201
    And a resposta deve indicar que o cadastro foi realizado com sucesso
    And o produto deve ser criado com o identificador retornado

  Scenario: CT11.3 - Impedir atualização com nome já utilizado por outro produto
    Given que o usuário está autenticado com perfil de administrador
    And existem dois produtos cadastrados com identificadores diferentes
    And o nome de um produto está em uso pelo outro
    When o usuário atualiza um dos produtos usando o nome já utilizado
    Then a resposta deve ter status 400
    And a mensagem deve ser "Já existe produto com esse nome"
    And os dados dos produtos devem permanecer inalterados

  Scenario: CT11.4 - Impedir atualização por usuário sem perfil de administrador
    Given que o usuário está autenticado sem perfil de administrador
    And existe um produto cadastrado
    When o usuário envia uma requisição PUT para /produtos/{_id} com dados válidos
    Then a resposta deve ter status 403
    And a mensagem deve ser "Rota exclusiva para administradores"
    And os dados do produto devem permanecer inalterados

