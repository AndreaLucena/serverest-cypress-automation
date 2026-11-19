import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { authenticate, checkFilter, checkList, createCart, createProduct, list, pathFor, read, register, send, state, unique, userData } from "../../../support/api";

const entity = "usuarios";
const route = "/usuarios";
const save = (user) => { state.user = user; };
const create = (overrides) => register(entity, userData(overrides)).then(save);
const target = () => pathFor(entity, state.id ?? state.user._id);
const compare = (user) => read(entity, user._id).then((body) => expect(body).to.deep.equal(user));

Given(/^que (?:existem usuários cadastrados|existe um usuário (?:cadastrado com (?:um identificador conhecido|dados conhecidos)|sem carrinho ativo))$/, () => create());
Given("que existe um usuário cadastrado com o valor {string} no campo {string}", (value, field) => {
  return create(field === "_id" ? {} : { [field]: value }).then(() => { state.filter = String(state.user[field]); });
});
Given("que não existe usuário com o email {string}", (email) => list(entity, { email }).then((items) => expect(items).to.be.empty));
Given("que o email {string} ainda não está cadastrado", (email) => {
  state.email = email;
  return list(entity, { email }).then((items) => expect(items).to.be.empty);
});
Given("que existe um usuário cadastrado com o email {string}", (email) => create({ email }));
Given("que não existe usuário com o identificador informado", () => { state.id = unique().slice(0, 16); });
Given("que existe um usuário com um carrinho ativo vinculado", () => {
  return authenticate().then(({ user, token }) => {
    save(user);
    return createProduct().then((product) => createCart([{ idProduto: product._id, quantidade: 1 }], token));
  });
});
Given("o email enviado ainda não está cadastrado", () => { state.payload = userData(); });
Given("que existem dois usuários cadastrados com identificadores diferentes", () => {
  return create().then(() => register(entity, userData())).then((other) => { state.other = other; });
});
Given("o email de um usuário está em uso pelo outro", () => {
  expect(state.other.email).not.to.eq(state.user.email);
});

When(String.raw`o consumidor envia uma requisição GET para \/usuarios`, () => send("GET", route));
When(String.raw`o consumidor envia uma requisição GET para \/usuarios filtrando por {string} com o valor {string}`, (field, value) =>
  send("GET", route, { qs: { [field]: state.filter ?? value } }),
);
When(String.raw`o consumidor envia uma requisição POST para \/usuarios com nome, email, password e administrador {string}`, (administrador) => {
  state.payload = userData({ email: state.email, administrador });
  return send("POST", route, { body: state.payload, track: entity });
});
When(String.raw`o consumidor envia uma requisição POST para \/usuarios com esse email`, () =>
  send("POST", route, { body: userData({ email: state.user.email }), track: entity }),
);
When(/^o consumidor envia uma requisição (GET|DELETE) para \/usuarios\/\{_id\} com (?:esse identificador|o identificador desse usuário)$/, (method) => send(method, target()));
When(/^o consumidor envia uma requisição PUT para \/usuarios\/\{_id\} com novos dados válidos e um email exclusivo$/, () => {
  state.payload = userData({ nome: "Usuário Rotas atualizado", administrador: "true" });
  return send("PUT", target(), { body: state.payload });
});
When(/^o consumidor envia uma requisição PUT para \/usuarios\/\{_id\} com nome, email, password e administrador$/, () =>
  send("PUT", target(), { body: state.payload, track: entity }),
);
When("o consumidor atualiza um dos usuários usando o email já utilizado", () =>
  send("PUT", target(), { body: userData({ email: state.other.email }), track: entity }),
);

Then("o corpo deve conter a quantidade de usuários retornados", () => checkList(entity));
Then("a lista de usuários deve conter os usuários cadastrados", () => expect(state.response.body.usuarios).to.deep.include(state.user));
Then("o usuário retornado deve corresponder ao filtro {string} com valor {string}", (field, value) => {
  checkFilter(entity, field, state.filter ?? value);
  expect(state.response.body.usuarios).to.deep.include(state.user);
});
Then("a quantidade de usuários retornados deve ser {int}", (count) => {
  checkList(entity);
  expect(state.response.body.quantidade).to.eq(count);
});
Then("a lista de usuários deve estar vazia", () => expect(state.response.body.usuarios).to.deep.equal([]));
Then("o usuário deve estar cadastrado com o perfil {string}", (administrador) =>
  compare({ ...state.payload, administrador, _id: state.response.body._id }),
);
Then("nenhum novo usuário deve ser cadastrado", () => list(entity, { email: state.user.email }).then((items) => expect(items).to.deep.equal([state.user])));
Then("o corpo deve conter os dados completos do usuário solicitado", () => expect(state.response.body).to.deep.equal(state.user));
Then("a resposta deve indicar que o usuário não foi encontrado", () => expect(state.response.body.message).to.eq("Usuário não encontrado"));
Then("o usuário não deve mais ser encontrado pelo identificador", () => read(entity, state.user._id, 400));
Then("a resposta deve indicar que o usuário não pode ser excluído enquanto possuir carrinho ativo", () => {
  expect(state.response.body.message).to.eq("Não é permitido excluir usuário com carrinho cadastrado");
});
Then("o usuário deve continuar cadastrado", () => compare(state.user));
Then("uma consulta pelo identificador deve retornar os novos dados do usuário", () => compare({ ...state.payload, _id: state.user._id }));
Then("o usuário deve ser criado com o identificador retornado", () => compare({ ...state.payload, _id: state.response.body._id }));
Then("os dados dos usuários devem permanecer inalterados", () => compare(state.user).then(() => compare(state.other)));
