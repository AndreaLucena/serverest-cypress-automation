import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { authenticate, checkFilter, checkList, createCart, createProduct, list, pathFor, read, send, state, unique } from "../../../support/api";

const entity = "carrinhos";
const route = `/${entity}`;
const regularItems = [
  { preco: 125, quantidade: 2, estoque: 10 },
  { preco: 90, quantidade: 3, estoque: 8 },
];

function signIn() {
  return authenticate().then(({ user, token }) => {
    state.user = user;
    state.token = token;
  });
}

function prepareItems(items) {
  state.items = [];
  for (const { preco, quantidade, estoque } of items) {
    createProduct({ preco, quantidade: estoque }).then((product) => {
      state.items.push({ product, quantidade });
    });
  }
  return cy.then(() => {
    state.payload = { produtos: state.items.map(({ product, quantidade }) => ({ idProduto: product._id, quantidade })) };
  });
}

function prepareCart(items = regularItems) {
  return signIn().then(() => prepareItems(items))
    .then(() => createCart(state.payload.produtos, state.token))
    .then(({ _id }) => { state.id = _id; });
}

function postCart() {
  return send("POST", route, { body: state.payload, token: state.token, track: entity });
}

function getCartsByFilter(field, value) {
  return send("GET", route, { qs: { [field]: value } });
}

function checkPreparedCartInList() {
  expect(state.response.body[entity].map(({ _id }) => _id)).to.include(state.id);
}

function checkContents(cart) {
  expect(cart).to.deep.include({ _id: state.id, idUsuario: state.user._id });
  expect(cart.produtos).to.have.deep.members(state.items.map(({ product, quantidade }) => ({
    idProduto: product._id, quantidade, precoUnitario: product.preco,
  })));
}

function checkTotals(cart) {
  expect(cart.quantidadeTotal).to.eq(state.items.reduce((total, item) => total + item.quantidade, 0));
  expect(cart.precoTotal).to.eq(state.items.reduce((total, item) => total + item.product.preco * item.quantidade, 0));
}

function checkStock(reserved) {
  for (const { product, quantidade } of state.items) {
    read("produtos", product._id).its("quantidade").should("eq", product.quantidade - (reserved ? quantidade : 0));
  }
}

Given(/^que (?:existem carrinhos ativos no sistema|existe um carrinho ativo com produtos e totais conhecidos|o usuário está autenticado e possui um carrinho ativo)$/, () => prepareCart());
When("é enviada uma requisição {string} para {string}", (method, url) => send(method, url));
Then("o corpo deve conter a quantidade de carrinhos retornados", () => checkList(entity));
Then("a lista deve conter os carrinhos ativos em formato JSON", () => {
  expect(state.response.headers["content-type"]).to.include("application/json");
  checkPreparedCartInList();
});

Given("que existe um carrinho ativo com o valor {string} no campo {string}", (value, field) => {
  const items = {
    precoTotal: [{ preco: Number(value), quantidade: 1, estoque: 10 }],
    quantidadeTotal: [{ preco: 125, quantidade: Number(value), estoque: 10 + Number(value) }],
  };
  return prepareCart(items[field]).then(() => {
    state.filter = field === "_id" ? state.id : field === "idUsuario" ? state.user._id : value;
  });
});
When(/^é enviada uma requisição GET para \/carrinhos\?(\w+)=(\w+)$/, (field, value) =>
  getCartsByFilter(field, state.filter ?? value),
);
Then("o carrinho retornado deve corresponder ao filtro {string} com valor {string}", (field, value) => {
  checkFilter(entity, field, state.filter ?? value);
  checkPreparedCartInList();
});

Given("que não existe carrinho com o valor {string} no campo {string}", (value, field) =>
  list(entity, { [field]: value }).then((items) => expect(items).to.be.empty),
);
When(
  String.raw`é enviada uma requisição GET para \/carrinhos filtrando por {string} com o valor {string}`,
  getCartsByFilter,
);
Then("a quantidade de carrinhos retornados deve ser {int}", (count) => {
  checkList(entity);
  expect(state.response.body.quantidade).to.eq(count);
});
Then("a lista de carrinhos deve estar vazia", () => expect(state.response.body[entity]).to.deep.equal([]));

Given(/^que o usuário está autenticado(?: e não possui carrinho ativo)?$/, signIn);
Given("existem produtos disponíveis com preços e estoques conhecidos", () => prepareItems(regularItems));
When(String.raw`o usuário envia uma requisição POST para \/carrinhos com os produtos e suas quantidades`, postCart);
Then("o carrinho deve conter os produtos e quantidades solicitados", () => {
  state.id = state.response.body._id;
  expect(state.id).to.match(/^[a-zA-Z0-9]{16}$/);
  return read(entity, state.id).then((cart) => {
    state.cart = cart;
    checkContents(cart);
  });
});
Then("os totais de preço e quantidade devem ser calculados corretamente", () => checkTotals(state.cart));
Then(/^o estoque (?:de cada produto deve ser reduzido pela quantidade adicionada|dos produtos não deve ser restituído)$/, () => checkStock(true));

Given("que o usuário não está autenticado", () => { expect(state.token).to.be.undefined; });
When(String.raw`é enviada uma requisição POST para \/carrinhos com produtos disponíveis`, () =>
  prepareItems(regularItems).then(postCart),
);
Then("a mensagem deve indicar que o token está ausente ou inválido", () => {
  expect(state.response.body.message).to.eq("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais");
});
Then("nenhum carrinho deve ser criado", () => {
  return list(entity).then((carts) => {
    const ids = state.payload.produtos.map(({ idProduto }) => idProduto);
    expect(carts.some(({ produtos }) => produtos.some(({ idProduto }) => ids.includes(idProduto)))).to.be.false;
  });
});

Given("existe um produto com estoque menor que a quantidade solicitada", () =>
  prepareItems([{ preco: 125, quantidade: 3, estoque: 2 }]),
);
When(String.raw`é enviada uma requisição POST para \/carrinhos com esse produto`, postCart);
Then("o carrinho não deve ser criado", () => list(entity, { idUsuario: state.user._id }).then((items) => expect(items).to.be.empty));
Then(/^(?:o estoque do produto deve permanecer inalterado|as quantidades reservadas devem retornar integralmente ao estoque)$/, () => checkStock(false));

When(/^é enviada uma requisição GET para \/carrinhos\/\{_id\} com (?:o identificador desse carrinho|esse identificador)$/, () =>
  send("GET", pathFor(entity, state.id)),
);
Then("o corpo deve conter os produtos, quantidades e totais do carrinho", () => {
  checkContents(state.response.body);
  checkTotals(state.response.body);
});

Given("que não existe carrinho com o identificador informado", () => { state.id = unique().slice(0, 16); });
Then("a resposta deve indicar que o carrinho não foi encontrado", () => expect(state.response.body.message).to.eq("Carrinho não encontrado"));

Given(/^(?:o estoque já foi reduzido ao reservar os produtos do carrinho|o carrinho reservou quantidades conhecidas de produtos)$/, () => checkStock(true));
When(/^é enviada uma requisição DELETE para \/carrinhos\/(concluir-compra|cancelar-compra)$/, (action) =>
  send("DELETE", `${route}/${action}`, { token: state.token }),
);
Then("o carrinho associado ao usuário deve ser removido", () => read(entity, state.id, 400));
