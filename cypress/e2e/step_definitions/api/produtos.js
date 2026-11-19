import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { authenticate, checkFilter, checkList, createCart, createProduct, list, pathFor, productData, read, send, state, unique } from "../../../support/api";

const entity = "produtos";
const route = "/produtos";
const save = (product) => { state.product = product; };
const create = (overrides) => createProduct(overrides).then(save);
const target = () => pathFor(entity, state.id ?? state.product._id);
const compare = (product) => read(entity, product._id).then((body) => expect(body).to.deep.equal(product));
const withToken = (options = {}) => ({ ...options, token: state.token });

Given(/^que o usuário está autenticado (com|sem) perfil de administrador$/, (profile) =>
  authenticate(profile === "com").then(({ token }) => { state.token = token; }),
);
Given(/^(?:que existem produtos cadastrados no catálogo|(?:que )?existe um produto (?:cadastrado(?: com (?:um identificador conhecido|dados conhecidos))?|que não está vinculado a carrinho ativo))$/, () => create());
Given("que existe um produto cadastrado com o valor {string} no campo {string}", (value, field) => {
  const overrides = field === "_id" ? {} : { [field]: ["preco", "quantidade"].includes(field) ? Number(value) : value };
  return create(overrides).then(() => { state.filter = String(state.product[field]); });
});
Given("que não existe produto com o valor {string} no campo {string}", (value, field) => list(entity, { [field]: value }).then((items) => expect(items).to.be.empty));
Given("não existe produto cadastrado com o nome {string}", (name) => {
  state.payload = productData({ nome: name });
  return list(entity, { nome: name }).then((items) => expect(items).to.be.empty);
});
Given("existe um produto cadastrado com o nome {string}", (nome) => create({ nome }));
Given(/^(?:que )?não existe produto com o identificador informado$/, () => { state.id = unique().slice(0, 16); });
Given("existe um produto que faz parte de um carrinho", () => {
  return create().then(() => authenticate()).then(({ token }) =>
    createCart([{ idProduto: state.product._id, quantidade: 1 }], token),
  );
});
Given("o nome enviado ainda não está cadastrado", () => { state.payload = productData(); });
Given("existem dois produtos cadastrados com identificadores diferentes", () => {
  return create().then(() => createProduct()).then((other) => { state.other = other; });
});
Given("o nome de um produto está em uso pelo outro", () => {
  expect(state.other.nome).not.to.eq(state.product.nome);
});

When(String.raw`o consumidor envia uma requisição GET para \/produtos`, () => send("GET", route));
When(String.raw`o consumidor envia uma requisição GET para \/produtos filtrando por {string} com o valor {string}`, (field, value) =>
  send("GET", route, { qs: { [field]: state.filter ?? value } }),
);
function post(payload) {
  state.payload = payload;
  return send("POST", route, withToken({ body: payload, track: entity }));
}
When(String.raw`o usuário envia uma requisição POST para \/produtos com nome, preco, descricao e quantidade`, () => post(state.payload));
When("o usuário tenta cadastrar outro produto com o mesmo nome", () => post(productData({ nome: state.product.nome })));
When(String.raw`ele envia uma requisição POST para \/produtos com dados válidos`, () => post(productData()));
When(/^o consumidor envia uma requisição GET para \/produtos\/\{_id\} com esse identificador$/, () => send("GET", target()));
When(/^o usuário envia uma requisição DELETE para \/produtos\/\{_id\} com o identificador desse produto$/, () => send("DELETE", target(), withToken()));
function put(payload) {
  state.payload = payload;
  return send("PUT", target(), withToken({ body: payload, track: entity }));
}
When(/^o usuário envia uma requisição PUT para \/produtos\/\{_id\} com novos dados válidos e um nome exclusivo$/, () =>
  put(productData({ preco: 300, descricao: "Descrição atualizada", quantidade: 12 })),
);
When(/^o usuário envia uma requisição PUT para \/produtos\/\{_id\} com nome, preco, descricao e quantidade$/, () => put(state.payload));
When("o usuário atualiza um dos produtos usando o nome já utilizado", () => put(productData({ nome: state.other.nome })));
When(/^o usuário envia uma requisição PUT para \/produtos\/\{_id\} com dados válidos$/, () => put(productData()));

Then("o corpo deve conter a quantidade de produtos retornados", () => checkList(entity));
Then("a lista deve conter os produtos cadastrados", () => expect(state.response.body.produtos).to.deep.include(state.product));
Then("todos os produtos retornados devem corresponder ao filtro {string} com valor {string}", (field, value) => {
  checkFilter(entity, field, state.filter ?? value);
  expect(state.response.body.produtos).to.deep.include(state.product);
});
Then("a quantidade de produtos retornados deve ser {int}", (count) => {
  checkList(entity);
  expect(state.response.body.quantidade).to.eq(count);
});
Then("a lista de produtos deve estar vazia", () => expect(state.response.body.produtos).to.deep.equal([]));
Then("o produto deve estar disponível no catálogo", () => compare({ ...state.payload, _id: state.response.body._id }));
Then("nenhum novo produto deve ser cadastrado", () => list(entity, { nome: state.product.nome }).then((items) => expect(items).to.deep.equal([state.product])));
Then("nenhum produto deve ser cadastrado", () => list(entity, { nome: state.payload.nome }).then((items) => expect(items).to.be.empty));
Then("o corpo deve conter os dados completos do produto solicitado", () => expect(state.response.body).to.deep.equal(state.product));
Then("a resposta deve indicar que o produto não foi encontrado", () => expect(state.response.body.message).to.eq("Produto não encontrado"));
Then("o produto não deve mais ser encontrado pelo identificador", () => read(entity, state.product._id, 400));
Then("o produto deve continuar cadastrado", () => read(entity, state.product._id));
Then("uma consulta pelo identificador deve retornar os novos dados do produto", () => compare({ ...state.payload, _id: state.product._id }));
Then("o produto deve ser criado com o identificador retornado", () => compare({ ...state.payload, _id: state.response.body._id }));
Then("os dados dos produtos devem permanecer inalterados", () => compare(state.product).then(() => compare(state.other)));
Then("os dados do produto devem permanecer inalterados", () => compare(state.product));
