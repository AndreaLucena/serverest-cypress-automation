Feature: Usuários

# UC02 - Listar Usuários (GET /usuarios)
  Scenario: CT02.1 - Listar usuários cadastrados
    Given que existem usuários cadastrados
    When o consumidor envia uma requisição GET para /usuarios
    Then a resposta deve ter status code 200
    And o corpo deve conter a quantidade de usuários retornados
    And a lista de usuários deve conter os usuários cadastrados

  Scenario Outline: CT02.2 - Filtrar usuários por um campo
    Given que existe um usuário cadastrado com o valor "<valor>" no campo "<campo>"
    When o consumidor envia uma requisição GET para /usuarios filtrando por "<campo>" com o valor "<valor>"
    Then a resposta deve ter status code 200
    And o usuário retornado deve corresponder ao filtro "<campo>" com valor "<valor>"

    Examples:
      | campo         | valor               |
      | _id           | 0uxuPY0cbmQhpEz1    |
      | nome          | Ana Teste           |
      | email         | ana.teste@teste.com |
      | password      | Senha@123           |
      | administrador | false               |

  Scenario: CT02.3 - Listar usuários sem resultados para o filtro informado
    Given que não existe usuário com o email "nao.cadastrado@teste.com"
    When o consumidor envia uma requisição GET para /usuarios filtrando por "email" com o valor "nao.cadastrado@teste.com"
    Then a resposta deve ter status code 200
    And a quantidade de usuários retornados deve ser 0
    And a lista de usuários deve estar vazia

# UC03 - Cadastrar Usuário (POST /usuarios)
  Scenario Outline: CT03.1 - Cadastrar usuário comum ou administrador
    Given que o email "<email>" ainda não está cadastrado
    When o consumidor envia uma requisição POST para /usuarios com nome, email, password e administrador "<administrador>"
    Then a resposta deve ter status 201
    And a mensagem deve indicar que o cadastro foi realizado com sucesso
    And o corpo deve conter o identificador do novo usuário
    And o usuário deve estar cadastrado com o perfil "<administrador>"

    Examples:
      | email                  | administrador |
      | usuario.comum@teste.com | false         |
      | usuario.admin@teste.com | true          |

  Scenario: CT03.2 - Impedir cadastro com email já utilizado
    Given que existe um usuário cadastrado com o email "existente@teste.com"
    When o consumidor envia uma requisição POST para /usuarios com esse email
    Then a resposta deve ter status code 400
    And a mensagem deve ser "Este email já está sendo usado"
    And nenhum novo usuário deve ser cadastrado

# UC04 - Buscar Usuário por ID (GET /usuarios/{_id})
  Scenario: CT04.1 - Buscar usuário existente pelo identificador
    Given que existe um usuário cadastrado com um identificador conhecido
    When o consumidor envia uma requisição GET para /usuarios/{_id} com esse identificador
    Then a resposta deve ter status code 200
    And o corpo deve conter os dados completos do usuário solicitado

  Scenario: CT04.2 - Buscar usuário inexistente pelo identificador
    Given que não existe usuário com o identificador informado
    When o consumidor envia uma requisição GET para /usuarios/{_id} com esse identificador
    Then a resposta deve ter status code 400
    And a resposta deve indicar que o usuário não foi encontrado

# UC05 - Excluir Usuário (DELETE /usuarios/{_id})
  Scenario: CT05.1 - Excluir usuário sem carrinho ativo
    Given que existe um usuário sem carrinho ativo
    When o consumidor envia uma requisição DELETE para /usuarios/{_id} com o identificador desse usuário
    Then a resposta deve ter status code 200
    And a resposta deve indicar que o registro foi excluído com sucesso
    And o usuário não deve mais ser encontrado pelo identificador

  Scenario: CT05.2 - Impedir exclusão de usuário com carrinho ativo
    Given que existe um usuário com um carrinho ativo vinculado
    When o consumidor envia uma requisição DELETE para /usuarios/{_id} com o identificador desse usuário
    Then a resposta deve ter status code 400
    And a resposta deve indicar que o usuário não pode ser excluído enquanto possuir carrinho ativo
    And o usuário deve continuar cadastrado

# UC06 - Editar Usuário (PUT /usuarios/{_id})
  Scenario: CT06.1 - Atualizar usuário existente
    Given que existe um usuário cadastrado com dados conhecidos
    When o consumidor envia uma requisição PUT para /usuarios/{_id} com novos dados válidos e um email exclusivo
    Then a resposta deve ter status code 200
    And a resposta deve indicar que o registro foi alterado com sucesso
    And uma consulta pelo identificador deve retornar os novos dados do usuário

  Scenario: CT06.2 - Criar usuário quando o identificador não existe
    Given que não existe usuário com o identificador informado
    And o email enviado ainda não está cadastrado
    When o consumidor envia uma requisição PUT para /usuarios/{_id} com nome, email, password e administrador
    Then a resposta deve ter status code 201
    And a resposta deve indicar que o cadastro foi realizado com sucesso
    And o usuário deve ser criado com o identificador retornado

  Scenario: CT06.3 - Impedir atualização com email já utilizado por outro usuário
    Given que existem dois usuários cadastrados com identificadores diferentes
    And o email de um usuário está em uso pelo outro
    When o consumidor atualiza um dos usuários usando o email já utilizado
    Then a resposta deve ter status code 400
    And a mensagem deve ser "Este email já está sendo usado"
    And os dados dos usuários devem permanecer inalterados


