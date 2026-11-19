import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { authenticate, checkFilter, checkList, createCart, createProduct, list, pathFor, productData, read, send, state, unique } from "../../../support/api";

const entity = "produtos";
const route = `/${entity}`;
const productPath = () => pathFor(entity, state.id ?? state.product._id);

function prepareProduct(overrides) {
  return createProduct(overrides).then((product) => {
    state.product = product;
    return product;
  });
}

function saveProduct(method, payload) {
  state.payload = payload;
  const url = method === "POST" ? route : productPath();
  return send(method, url, { body: payload, token: state.token, track: entity });
}

function checkStoredProduct(expected) {
  return read(entity, expected._id).then((product) => expect(product).to.deep.equal(expected));
}

function checkCreatedProduct() {
  return checkStoredProduct({ ...state.payload, _id: state.response.body._id });
}

function checkPreparedProductInList() {
  expect(state.response.body.produtos).to.deep.include(state.product);
}

function checkNoMatchingProducts(filters) {
  return list(entity, filters).then((items) => expect(items).to.be.empty);
}

Given(/^(?:que existem produtos cadastrados no catálogo|(?:que )?existe um produto (?:cadastrado(?: com (?:um identificador conhecido|dados conhecidos))?|que não está vinculado a carrinho ativo))$/, prepareProduct);
When(String.raw`o consumidor envia uma requisição GET para \/produtos`, () => send("GET", route));
Then("o corpo deve conter a quantidade de produtos retornados", () => checkList(entity));
Then("a lista deve conter os produtos cadastrados", checkPreparedProductInList);

Given("que existe um produto cadastrado com o valor {string} no campo {string}", (value, field) => {
  const filterValue = ["preco", "quantidade"].includes(field) ? Number(value) : value;
  const overrides = field === "_id" ? undefined : { [field]: filterValue };
  return prepareProduct(overrides).then((product) => {
    state.filter = String(product[field]);
  });
});
When(String.raw`o consumidor envia uma requisição GET para \/produtos filtrando por {string} com o valor {string}`, (field, value) =>
  send("GET", route, { qs: { [field]: state.filter ?? value } }),
);
Then("todos os produtos retornados devem corresponder ao filtro {string} com valor {string}", (field, value) => {
  checkFilter(entity, field, state.filter ?? value);
  checkPreparedProductInList();
});

Given("que não existe produto com o valor {string} no campo {string}", (value, field) =>
  checkNoMatchingProducts({ [field]: value }),
);
Then("a quantidade de produtos retornados deve ser {int}", (count) => {
  checkList(entity);
  expect(state.response.body.quantidade).to.eq(count);
});
Then("a lista de produtos deve estar vazia", () => expect(state.response.body.produtos).to.deep.equal([]));

Given(/^que o usuário está autenticado (com|sem) perfil de administrador$/, (profile) =>
  authenticate(profile === "com").then(({ token }) => { state.token = token; }),
);
Given("não existe produto cadastrado com o nome {string}", (name) => {
  state.payload = productData({ nome: name });
  return checkNoMatchingProducts({ nome: name });
});
When(String.raw`o usuário envia uma requisição POST para \/produtos com nome, preco, descricao e quantidade`, () =>
  saveProduct("POST", state.payload),
);
Then("o produto deve estar disponível no catálogo", checkCreatedProduct);

Given("existe um produto cadastrado com o nome {string}", (nome) => prepareProduct({ nome }));
When("o usuário tenta cadastrar outro produto com o mesmo nome", () =>
  saveProduct("POST", productData({ nome: state.product.nome })),
);
Then("nenhum novo produto deve ser cadastrado", () => list(entity, { nome: state.product.nome }).then((items) => expect(items).to.deep.equal([state.product])));

When(String.raw`ele envia uma requisição POST para \/produtos com dados válidos`, () => saveProduct("POST", productData()));
Then("nenhum produto deve ser cadastrado", () => checkNoMatchingProducts({ nome: state.payload.nome }));

When(/^o consumidor envia uma requisição GET para \/produtos\/\{_id\} com esse identificador$/, () => send("GET", productPath()));
Then("o corpo deve conter os dados completos do produto solicitado", () => expect(state.response.body).to.deep.equal(state.product));

Given(/^(?:que )?não existe produto com o identificador informado$/, () => { state.id = unique().slice(0, 16); });
Then("a resposta deve indicar que o produto não foi encontrado", () => expect(state.response.body.message).to.eq("Produto não encontrado"));

When(/^o usuário envia uma requisição DELETE para \/produtos\/\{_id\} com o identificador desse produto$/, () =>
  send("DELETE", productPath(), { token: state.token }),
);
Then("o produto não deve mais ser encontrado pelo identificador", () => read(entity, state.product._id, 400));

Given("existe um produto que faz parte de um carrinho", () =>
  prepareProduct().then((product) =>
    authenticate().then(({ token }) => createCart([{ idProduto: product._id, quantidade: 1 }], token)),
  ),
);
Given("os dados do produto são consultados antes da tentativa de exclusão", () =>
  read(entity, state.product._id).then((product) => { state.productBeforeDeletion = product; }),
);
Then("a consulta pelo mesmo _id deve retornar o produto com nome, preco, descricao e quantidade inalterados", () =>
  checkStoredProduct(state.productBeforeDeletion),
);

When(/^o usuário envia uma requisição PUT para \/produtos\/\{_id\} com novos dados válidos e um nome exclusivo$/, () =>
  saveProduct("PUT", productData({ preco: 300, descricao: "Descrição atualizada", quantidade: 12 })),
);
Then("uma consulta pelo identificador deve retornar os novos dados do produto", () =>
  checkStoredProduct({ ...state.payload, _id: state.product._id }),
);

Given("o nome enviado ainda não está cadastrado", () => { state.payload = productData(); });
When(/^o usuário envia uma requisição PUT para \/produtos\/\{_id\} com nome, preco, descricao e quantidade$/, () =>
  saveProduct("PUT", state.payload),
);
Then("o produto deve ser criado com o identificador retornado", checkCreatedProduct);

Given("existem dois produtos cadastrados com identificadores diferentes", () => {
  return prepareProduct().then(() => createProduct()).then((other) => { state.other = other; });
});
Given("o nome de um produto está em uso pelo outro", () => {
  expect(state.other.nome).not.to.eq(state.product.nome);
});

When("o usuário atualiza um dos produtos usando o nome já utilizado", () =>
  saveProduct("PUT", productData({ nome: state.other.nome })),
);
Then("os dados dos produtos devem permanecer inalterados", () =>
  checkStoredProduct(state.product).then(() => checkStoredProduct(state.other)),
);

When(/^o usuário envia uma requisição PUT para \/produtos\/\{_id\} com dados válidos$/, () =>
  saveProduct("PUT", productData()),
);
Then("os dados do produto devem permanecer inalterados", () => checkStoredProduct(state.product));
