import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { authenticate, checkFilter, checkList, createCart, createProduct, list, pathFor, read, register, send, state, unique, userData } from "../../../support/api";

const entity = "usuarios";
const route = `/${entity}`;
const userPath = () => pathFor(entity, state.id ?? state.user._id);
const registerUser = (overrides) => register(entity, userData(overrides));

function prepareUser(overrides) {
  return registerUser(overrides).then((user) => {
    state.user = user;
  });
}

function postUser(body) {
  return send("POST", route, { body, track: entity });
}

function checkStoredUser(expected) {
  return read(entity, expected._id).then((user) => expect(user).to.deep.equal(expected));
}

function checkEmailNotRegistered(email) {
  return list(entity, { email }).then((items) => expect(items).to.be.empty);
}

function checkPreparedUserInList() {
  expect(state.response.body[entity]).to.deep.include(state.user);
}

Given(/^que (?:existem usuários cadastrados|existe um usuário (?:cadastrado com (?:um identificador conhecido|dados conhecidos)|sem carrinho ativo))$/, () => prepareUser());
When(String.raw`o consumidor envia uma requisição GET para \/usuarios`, () => send("GET", route));
Then("o corpo deve conter a quantidade de usuários retornados", () => checkList(entity));
Then("a lista de usuários deve conter os usuários cadastrados", checkPreparedUserInList);

Given("que existe um usuário cadastrado com o valor {string} no campo {string}", (value, field) => {
  return prepareUser(field === "_id" ? undefined : { [field]: value }).then(() => {
    state.filter = String(state.user[field]);
  });
});
When(String.raw`o consumidor envia uma requisição GET para \/usuarios filtrando por {string} com o valor {string}`, (field, value) =>
  send("GET", route, { qs: { [field]: state.filter ?? value } }),
);
Then("o usuário retornado deve corresponder ao filtro {string} com valor {string}", (field, value) => {
  checkFilter(entity, field, state.filter ?? value);
  checkPreparedUserInList();
});

Given("que não existe usuário com o email {string}", checkEmailNotRegistered);
Then("a quantidade de usuários retornados deve ser {int}", (count) => {
  checkList(entity);
  expect(state.response.body.quantidade).to.eq(count);
});
Then("a lista de usuários deve estar vazia", () => expect(state.response.body[entity]).to.deep.equal([]));

Given("que o email {string} ainda não está cadastrado", (email) => {
  state.email = email;
  return checkEmailNotRegistered(email);
});
When(String.raw`o consumidor envia uma requisição POST para \/usuarios com nome, email, password e administrador {string}`, (administrador) => {
  state.payload = userData({ email: state.email, administrador });
  return postUser(state.payload);
});
Then("o usuário deve estar cadastrado com o perfil {string}", (administrador) =>
  checkStoredUser({ ...state.payload, administrador, _id: state.response.body._id }),
);

Given("que existe um usuário cadastrado com o email {string}", (email) => prepareUser({ email }));
When(String.raw`o consumidor envia uma requisição POST para \/usuarios com esse email`, () =>
  postUser(userData({ email: state.user.email })),
);
Then("nenhum novo usuário deve ser cadastrado", () =>
  list(entity, { email: state.user.email }).then((users) => expect(users).to.deep.equal([state.user])),
);

When(/^o consumidor envia uma requisição (GET|DELETE) para \/usuarios\/\{_id\} com (?:esse identificador|o identificador desse usuário)$/, (method) => send(method, userPath()));
Then("o corpo deve conter os dados completos do usuário solicitado", () => expect(state.response.body).to.deep.equal(state.user));

Given("que não existe usuário com o identificador informado", () => { state.id = unique().slice(0, 16); });
Then("a resposta deve indicar que o usuário não foi encontrado", () => expect(state.response.body.message).to.eq("Usuário não encontrado"));

Then("o usuário não deve mais ser encontrado pelo identificador", () => read(entity, state.user._id, 400));

Given("que existe um usuário com um carrinho ativo vinculado", () => {
  return authenticate().then(({ user, token }) => {
    state.user = user;
    return createProduct().then((product) => createCart([{ idProduto: product._id, quantidade: 1 }], token));
  });
});
Then("a resposta deve indicar que o usuário não pode ser excluído enquanto possuir carrinho ativo", () => {
  expect(state.response.body.message).to.eq("Não é permitido excluir usuário com carrinho cadastrado");
});
Then("o usuário deve continuar cadastrado", () => checkStoredUser(state.user));

When(/^o consumidor envia uma requisição PUT para \/usuarios\/\{_id\} com novos dados válidos e um email exclusivo$/, () => {
  state.payload = userData({ nome: "Usuário Rotas atualizado", administrador: "true" });
  return send("PUT", userPath(), { body: state.payload });
});
Then("uma consulta pelo identificador deve retornar os novos dados do usuário", () =>
  checkStoredUser({ ...state.payload, _id: state.user._id }),
);

Given("o email enviado ainda não está cadastrado", () => { state.payload = userData(); });
When(/^o consumidor envia uma requisição PUT para \/usuarios\/\{_id\} com nome, email, password e administrador$/, () =>
  send("PUT", userPath(), { body: state.payload, track: entity }),
);
Then("o usuário deve ser criado com o identificador retornado", () =>
  checkStoredUser({ ...state.payload, _id: state.response.body._id }),
);

Given("que existem dois usuários cadastrados com identificadores diferentes", () => {
  return prepareUser().then(() => registerUser()).then((other) => {
    state.other = other;
  });
});
Given("o email de um usuário está em uso pelo outro", () => {
  expect(state.other.email).not.to.eq(state.user.email);
});
When("o consumidor atualiza um dos usuários usando o email já utilizado", () =>
  send("PUT", userPath(), { body: userData({ email: state.other.email }), track: entity }),
);
Then("os dados dos usuários devem permanecer inalterados", () =>
  checkStoredUser(state.user).then(() => checkStoredUser(state.other)),
);
