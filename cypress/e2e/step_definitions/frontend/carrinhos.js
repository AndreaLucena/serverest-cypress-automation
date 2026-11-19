import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { authenticate, createCart, createProduct, list, read, state, unique } from "../../../support/api";

const frontend = "https://front.serverest.dev";
const api = "https://serverest.dev";
const blockedMessage = "Não é permitido excluir produto que faz parte de carrinho";
const testId = (id) => cy.get(`[data-testid="${id}"]`);
const productName = (name) => {
  state.productNames ??= new Map();
  if (!state.productNames.has(name)) state.productNames.set(name, `${name} ${unique()}`);
  return state.productNames.get(name);
};
const rowFor = (name) => cy.contains("tbody td:first-child", productName(name)).closest("tr");

function loginThroughFrontend(admin) {
  const backend = new URL(Cypress.config("baseUrl"));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(backend.hostname)) {
    throw new Error("Os testes de frontend exigem uma instância local do ServeRest.");
  }

  cy.intercept({ url: `${api}/**`, middleware: true }, (req) => {
    const url = new URL(req.url);
    req.url = new URL(`${url.pathname}${url.search}`, backend.origin).href;
  });
  return authenticate(admin).then(({ user, token }) => {
    if (!admin) state.customer = { id: user._id, token };
    cy.visit(`${frontend}/login`);
    testId("email").type(user.email, { log: false });
    testId("senha").type(user.password, { log: false });
    testId("entrar").click();
    cy.location("pathname").should("match", admin ? /^\/admin(?:\/|$)/ : /^\/home\/?$/);
  });
}

Given("que o administrador está autenticado", () => loginThroughFrontend(true));
Given("que o cliente está autenticado", () => loginThroughFrontend(false));

Given("não existe um produto chamado {string} no catálogo", (name) => {
  return list("produtos", { nome: productName(name) }).then((products) => {
    expect(products).to.be.empty;
  });
});

When("o administrador cadastra {string} com descrição {string}, preço {int} e quantidade {int}", (name, description, price, quantity) => {
  cy.intercept("POST", `${api}/produtos`).as("createProduct");
  testId("cadastrar-produtos").click();
  testId("nome").type(productName(name));
  testId("descricao").type(description);
  testId("preco").type(String(price));
  testId("quantity").type(String(quantity));
  testId("cadastarProdutos").click();
  cy.wait("@createProduct").then(({ response }) => {
    expect(response?.statusCode).to.eq(201);
    state.cleanup.produtos.push(response.body._id);
  });
});

Then("a lista de estoque exibe {string} com preço {int} e quantidade {int}", (name, price, quantity) => {
  rowFor(name).find("td").should(($cells) => {
    expect($cells.eq(1).text()).to.eq(String(price));
    expect($cells.eq(3).text()).to.eq(String(quantity));
  });
});

Given("um cliente tem {string} em seu carrinho ativo", (name) => {
  return createProduct({ nome: productName(name) }).then((product) =>
    authenticate().then(({ token }) =>
      createCart([{ idProduto: product._id, quantidade: 1 }], token),
    ),
  );
});

When("o administrador tenta excluir {string} do catálogo", (name) => {
  cy.intercept("DELETE", `${api}/produtos/*`).as("deleteProduct");
  testId("listar-produtos").click();
  rowFor(name).contains("button", "Excluir").click();
  cy.wait("@deleteProduct").then(({ response }) => {
    expect(response?.statusCode).to.eq(400);
    expect(response.body.message).to.eq(blockedMessage);
  });
});

Then("{string} permanece na lista de estoque", (name) => rowFor(name).should("be.visible"));

Then("é exibida mensagem de que não é permitido excluir um produto que faz parte de um carrinho", () => {
  cy.contains(blockedMessage).should("be.visible");
});

Given("existe um produto chamado {string} no estoque com {int} unidades", (name, quantity) => {
  return createProduct({ nome: productName(name), quantidade: quantity }).then((product) => {
    state.stockProduct = product;
  });
});

When("o cliente adiciona ao carrinho {int} unidades de {string}", (quantity, name) => {
  const product = productName(name);
  state.cleanup.carrinhos.push(state.customer.token);
  cy.reload();
  cy.contains(".card-title", product).closest(".card").find('[data-testid="adicionarNaLista"]').click();
  for (let count = 1; count < quantity; count++) {
    cy.contains(".card", product).find('[data-testid="product-increase-quantity"]').click();
  }
  cy.contains('[data-testid="shopping-cart-product-name"]', product)
    .closest(".card")
    .find('[data-testid="shopping-cart-product-quantity"]')
    .should("have.text", `Total: ${quantity}`);
  cy.contains("button", "Adicionar no carrinho").click();
  return cy.location("pathname").should("eq", "/carrinho");
});

Then("um carrinho ativo contém {int} unidades de {string}", (quantity, name) => {
  expect(state.stockProduct.nome).to.eq(productName(name));
  return list("carrinhos", { idUsuario: state.customer.id }).then((carts) => {
    expect(carts, "carrinho ativo do cliente").to.have.length(1);
    expect(carts[0].produtos).to.deep.include({
      idProduto: state.stockProduct._id,
      quantidade: quantity,
      precoUnitario: state.stockProduct.preco,
    });
  });
});

Then("o estoque exibe {int} unidades de {string}", (quantity, name) => {
  expect(state.stockProduct.nome).to.eq(productName(name));
  return read("produtos", state.stockProduct._id).its("quantidade").should("eq", quantity);
});