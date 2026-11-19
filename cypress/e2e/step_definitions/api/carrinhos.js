import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import {
  authenticate, checkFilter, checkList, createCart, createProduct, list, pathFor, read, send, state, unique,
} from "../../../support/api";

const entity = "carrinhos";
const route = `/${entity}`;
const defaultItems = [
  { preco: 125, quantidade: 2, estoque: 10 },
  { preco: 90, quantidade: 3, estoque: 8 },
];

function signIn() {
  return authenticate().then(({ user: { _id }, token }) => {
    state.userId = _id;
    state.token = token;
  });
}

function itemsFromTable(table) {
  return table.hashes().map((row) => ({
    nome: row.produto,
    preco: Number(row["preço unitário"]),
    estoque: Number(row["estoque inicial"]),
    quantidade: Number(row["quantidade solicitada"]),
  }));
}

function prepareItems(items) {
  state.items = [];
  return cy.wrap(items, { log: false }).each(({ nome, preco, quantidade, estoque }) => {
    const data = { preco, quantidade: estoque };
    if (nome) data.nome = `${nome} ${unique()}`;
    return createProduct(data).then(({ _id, preco }) => {
      state.items.push({ nome, idProduto: _id, quantidade, precoUnitario: preco });
    });
  });
}

function cartProducts() {
  return state.items.map(({ idProduto, quantidade }) => ({ idProduto, quantidade }));
}

function prepareCart(items = defaultItems) {
  return signIn()
    .then(() => prepareItems(items))
    .then(() => createCart(cartProducts(), state.token))
    .then(({ _id }) => {
      state.cartId = _id;
    });
}

function postCart() {
  return send("POST", route, { body: { produtos: cartProducts() }, token: state.token, track: entity });
}

function getCartsByFilter(field, value) {
  return send("GET", route, { qs: { [field]: value } });
}

function checkPreparedCartInList() {
  expect(state.response.body[entity].map(({ _id }) => _id)).to.include(state.cartId);
}

function checkContents(cart) {
  expect(cart).to.deep.include({ _id: state.cartId, idUsuario: state.userId });
  expect(cart.produtos).to.have.deep.members(state.items.map(({ idProduto, quantidade, precoUnitario }) => ({
    idProduto, quantidade, precoUnitario,
  })));
}

function checkTotals(cart) {
  let quantidadeTotal = 0;
  let precoTotal = 0;
  for (const { quantidade, precoUnitario } of state.items) {
    quantidadeTotal += quantidade;
    precoTotal += quantidade * precoUnitario;
  }
  expect(cart).to.include({ quantidadeTotal, precoTotal });
}

Given(/^que (?:existem carrinhos ativos no sistema|existe um carrinho ativo com produtos e totais conhecidos)$/, () => prepareCart());
When("é enviada uma requisição {string} para {string}", (method, url) => send(method, url));
Then("o corpo deve conter a quantidade de carrinhos retornados", () => checkList(entity));
Then("a lista deve conter os carrinhos ativos em formato JSON", () => {
  expect(state.response.headers["content-type"]).to.include("application/json");
  checkPreparedCartInList();
});

Given("que existe um carrinho ativo com o valor {string} no campo {string}", (value, field) => {
  const amount = Number(value);
  const items = {
    precoTotal: [{ preco: amount, quantidade: 1, estoque: 10 }],
    quantidadeTotal: [{ preco: 125, quantidade: amount, estoque: 10 + amount }],
  };
  return prepareCart(items[field]).then(() => {
    const identifiers = { _id: state.cartId, idUsuario: state.userId };
    state.filter = identifiers[field] ?? value;
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
Given("existem produtos com os seguintes preços, estoques e quantidades solicitadas", (table) =>
  prepareItems(itemsFromTable(table)),
);
When(String.raw`o usuário envia uma requisição POST para \/carrinhos com os produtos e suas quantidades`, postCart);
Then("o carrinho deve conter os produtos e quantidades solicitados", () => {
  state.cartId = state.response.body._id;
  expect(state.cartId).to.match(/^[a-zA-Z0-9]{16}$/);
  return read(entity, state.cartId).then((cart) => {
    state.cart = cart;
    checkContents(cart);
  });
});
Then("os totais de preço e quantidade devem ser calculados corretamente", () => checkTotals(state.cart));
Then("a consulta de estoque retorna {int} unidades de {string}", (expected, name) => {
  const item = state.items.find(({ nome }) => nome === name);
  expect(item, `produto preparado: ${name}`).to.exist;
  return read("produtos", item.idProduto).then(({ quantidade }) => {
    expect(quantidade, `saldo de estoque de ${name}`).to.eq(expected);
  });
});

Given("que o usuário não está autenticado", () => { expect(state.token).to.be.undefined; });
When(String.raw`é enviada uma requisição POST para \/carrinhos com produtos disponíveis`, () =>
  prepareItems(defaultItems).then(postCart),
);
Then("a mensagem deve indicar que o token está ausente ou inválido", () => {
  expect(state.response.body.message).to.eq("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais");
});
Then("nenhum carrinho deve ser criado", () => list(entity).then((carts) => {
  const preparedIds = new Set(state.items.map(({ idProduto }) => idProduto));
  const containsPreparedProduct = ({ produtos }) => produtos.some(({ idProduto }) => preparedIds.has(idProduto));
  expect(carts.some(containsPreparedProduct), "carrinho com um produto preparado").to.be.false;
}));

When(String.raw`é enviada uma requisição POST para \/carrinhos com esse produto`, postCart);
Then("o carrinho não deve ser criado", () =>
  list(entity, { idUsuario: state.userId }).then((carts) => expect(carts).to.be.empty),
);

When(/^é enviada uma requisição GET para \/carrinhos\/\{_id\} com (?:o identificador desse carrinho|esse identificador)$/, () =>
  send("GET", pathFor(entity, state.cartId)),
);
Then("o corpo deve conter os produtos, quantidades e totais do carrinho", () => {
  checkContents(state.response.body);
  checkTotals(state.response.body);
});

Given("que não existe carrinho com o identificador informado", () => {
  state.cartId = unique().slice(0, 16);
});
Then("a resposta deve indicar que o carrinho não foi encontrado", () => expect(state.response.body.message).to.eq("Carrinho não encontrado"));

Given("que o usuário está autenticado e possui um carrinho ativo com as seguintes reservas", (table) =>
  prepareCart(itemsFromTable(table)),
);
When(/^é enviada uma requisição DELETE para \/carrinhos\/(concluir-compra|cancelar-compra)$/, (action) =>
  send("DELETE", `${route}/${action}`, { token: state.token }),
);
Then("o carrinho associado ao usuário deve ser removido", () => read(entity, state.cartId, 400));
