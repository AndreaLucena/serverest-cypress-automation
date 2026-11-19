Feature: Cadastro de produtos e gestão de estoque nas compras com carrinho

 @reserva-estoque
  Scenario: O produto cadastrado pelo administrador é listado no estoque com os dados corretos
    Given que o administrador está autenticado
    And não existe um produto chamado "Produto Teste" no catálogo
    When o administrador cadastra "Produto Teste" com descrição "Produto para teste", preço 150 e quantidade 10
    Then a lista de estoque exibe "Produto Teste" com preço 150 e quantidade 10

  Scenario: O administrador não pode excluir um produto que está no carrinho de um cliente
    Given que o administrador está autenticado
    And um cliente tem "Produto Teste" em seu carrinho ativo
    When o administrador tenta excluir "Produto Teste" do catálogo
    Then "Produto Teste" permanece na lista de estoque
    And é exibida mensagem de que não é permitido excluir um produto que faz parte de um carrinho

  @reserva-estoque
  Scenario: Cliente inclui produtos no carrinho e o estoque é atualizado
    Given que o cliente está autenticado
    And existe um produto chamado "Produto Teste" no estoque com 10 unidades
    When o cliente adiciona ao carrinho 2 unidades de "Produto Teste"
    Then um carrinho ativo contém 2 unidades de "Produto Teste"
    And o estoque exibe 8 unidades de "Produto Teste"
