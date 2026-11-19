Feature: Cadastro de produtos e gestão de estoque nas compras com carrinho

  Scenario: O produto cadastrado pelo administrador aparece com os dados corretos no estoque
    Given que o administrador está autenticado
    And não existe um produto chamado "Produto Teste" no catálogo
    When o administrador cadastra "Produto Teste" com descrição "Produto para teste", preço 150 e quantidade 10
    Then a lista de estoque exibe "Produto Teste" com preço 150 e quantidade 10

  Scenario: O administrador não pode excluir um produto que está no carrinho de um cliente
    Given que o administrador está autenticado
    And um cliente tem "Produto Teste" em seu carrinho ativo
    When o administrador tenta excluir "Produto Teste" do catálogo
    Then "Produto Teste" permanece na lista de estoque
    And a interface informa que não é permitido excluir um produto que faz parte de um carrinho

  Scenario: Cancelar a compra devolve ao estoque as unidades reservadas no carrinho
    Given que o cliente está autenticado
    And havia 10 unidades de "Produto Teste" antes da reserva
    And o carrinho do cliente contém 2 unidades de "Produto Teste"
    And o estoque reflete a quantidade disponível de 8 unidades
    When o cliente cancela a compra
    Then o cliente fica sem carrinho ativo
    And o estoque exibe 10 unidades de "Produto Teste"
