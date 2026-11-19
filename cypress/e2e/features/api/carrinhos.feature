Feature: Carrinhos

# UC12 - Listar Carrinhos (GET /carrinhos)
  Scenario: CT12.1 - Listar carrinhos ativos
    Given que existem carrinhos ativos no sistema
    When é enviada uma requisição "GET" para "/carrinhos"
    Then a resposta deve ter status 200
    And o corpo deve conter a quantidade de carrinhos retornados
    And a lista deve conter os carrinhos ativos em formato JSON

  Scenario Outline: CT12.2 - Filtrar carrinhos por um campo
    Given que existe um carrinho ativo com o valor "<valor>" no campo "<campo>"
    When é enviada uma requisição GET para /carrinhos?<campo>=<valor>
    Then a resposta deve ter status 200
    And o carrinho retornado deve corresponder ao filtro "<campo>" com valor "<valor>"

    Examples:
      | campo           | valor              |
      | _id             | qbMqntef4iTOwWfg   |
      | precoTotal      | 1300               |
      | quantidadeTotal | 2                  |
      | idUsuario       | 0uxuPY0cbmQhpEz1   |

  Scenario: CT12.3 - Listar carrinhos sem resultados para o filtro informado
    Given que não existe carrinho com o valor "inexistente" no campo "idUsuario"
    When é enviada uma requisição GET para /carrinhos filtrando por "idUsuario" com o valor "inexistente"
    Then a resposta deve ter status 200
    And a quantidade de carrinhos retornados deve ser 0
    And a lista de carrinhos deve estar vazia

# UC13 - Cadastrar Carrinho (POST /carrinhos)
  Scenario: CT13.1 - Cadastrar carrinho e reservar estoque dos produtos
    Given que o usuário está autenticado
    And existem produtos disponíveis com preços e estoques conhecidos
    When o usuário envia uma requisição POST para /carrinhos com os produtos e suas quantidades
    Then a resposta deve ter status 201
    And a mensagem deve ser "Cadastro realizado com sucesso"
    And o carrinho deve conter os produtos e quantidades solicitados
    And os totais de preço e quantidade devem ser calculados corretamente
    And o estoque de cada produto deve ser reduzido pela quantidade adicionada

  Scenario: CT13.2 - Impedir cadastro de carrinho sem autenticação
    Given que o usuário não está autenticado
    When é enviada uma requisição POST para /carrinhos com produtos disponíveis
    Then a resposta deve ter status 401
    And a mensagem deve indicar que o token está ausente ou inválido
    And nenhum carrinho deve ser criado

  Scenario: CT13.3 - Impedir reserva acima do estoque disponível
    Given que o usuário está autenticado
    And existe um produto com estoque menor que a quantidade solicitada
    When é enviada uma requisição POST para /carrinhos com esse produto
    Then a resposta deve ter status 400
    And a mensagem deve ser "Produto não possui quantidade suficiente"
    And o carrinho não deve ser criado
    And o estoque do produto deve permanecer inalterado

# UC14 - Buscar Carrinho por ID (GET /carrinhos/{_id})
  Scenario: CT14.1 - Buscar carrinho existente pelo identificador
    Given que existe um carrinho ativo com produtos e totais conhecidos
    When é enviada uma requisição GET para /carrinhos/{_id} com o identificador desse carrinho
    Then a resposta deve ter status 200
    And o corpo deve conter os produtos, quantidades e totais do carrinho

  Scenario: CT14.2 - Buscar carrinho inexistente pelo identificador
    Given que não existe carrinho com o identificador informado
    When é enviada uma requisição GET para /carrinhos/{_id} com esse identificador
    Then a resposta deve ter status 400
    And a resposta deve indicar que o carrinho não foi encontrado

# UC15 - Concluir Compra (DELETE /carrinhos/concluir-compra)
  Scenario: CT15.1 - Concluir compra e manter a baixa de estoque
    Given que o usuário está autenticado e possui um carrinho ativo
    And o estoque já foi reduzido ao reservar os produtos do carrinho
    When é enviada uma requisição DELETE para /carrinhos/concluir-compra
    Then a resposta deve ter status 200
    And a mensagem deve ser "Registro excluído com sucesso"
    And o carrinho associado ao usuário deve ser removido
    And o estoque dos produtos não deve ser restituído

  Scenario: CT15.2 - Impedir conclusão de compra sem carrinho ativo
    Given que o usuário está autenticado e não possui carrinho ativo
    When é enviada uma requisição DELETE para /carrinhos/concluir-compra
    Then a resposta deve ter status 200
    And a mensagem deve ser "Não foi encontrado carrinho para esse usuário"

# UC16 - Cancelar Compra (DELETE /carrinhos/cancelar-compra)
  Scenario: CT16.1 - Cancelar compra e restituir todo o estoque reservado
    Given que o usuário está autenticado e possui um carrinho ativo
    And o carrinho reservou quantidades conhecidas de produtos
    When é enviada uma requisição DELETE para /carrinhos/cancelar-compra
    Then a resposta deve ter status 200
    And a mensagem deve ser "Registro excluído com sucesso. Estoque dos produtos reabastecido"
    And o carrinho associado ao usuário deve ser removido
    And as quantidades reservadas devem retornar integralmente ao estoque

  Scenario: CT16.2 - Impedir cancelamento de compra sem carrinho ativo
    Given que o usuário está autenticado e não possui carrinho ativo
    When é enviada uma requisição DELETE para /carrinhos/cancelar-compra
    Then a resposta deve ter status 200
    And a mensagem deve ser "Não foi encontrado carrinho para esse usuário"