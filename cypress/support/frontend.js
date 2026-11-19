export const testIdSelector = (id) => `[data-testid="${id}"]`;

// O Page Object reúne seletores e ações do fluxo da Lista de Compras; os steps decidem o que validar.
export const shoppingListPage = {
  addProductFromCatalog(name) {
    return cy.contains(".card-title", name).closest(".card").find(testIdSelector("adicionarNaLista")).click();
  },

  increaseQuantity(name) {
    return cy.contains(".card", name).find(testIdSelector("product-increase-quantity")).click();
  },

  quantityLabel(name) {
    return cy.contains(testIdSelector("shopping-cart-product-name"), name)
      .closest(".card")
      .find(testIdSelector("shopping-cart-product-quantity"));
  },

  addToCart() {
    return cy.contains("button", "Adicionar no carrinho").click();
  },
};