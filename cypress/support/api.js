import { After, Before, Then } from "@badeball/cypress-cucumber-preprocessor";

export let state;
const pathFor = (entity, id) => `/${entity}/${id}`;
export { pathFor };

export function unique() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function request(method, url, { body, qs, token } = {}) {
  const headers = token ? { Authorization: token } : {};
  return cy.request({
    method, url, body, qs, headers, failOnStatusCode: false,
    followRedirect: false, log: false,
  });
}

export function send(method, url, options) {
  return request(method, url, options).then((response) => {
    state.response = response;
    if (response.status === 201 && options?.track) {
      state.cleanup[options.track].push(options.track === "carrinhos" ? options.token : response.body._id);
    }
  });
}

export function userData(overrides = {}) {
  return { nome: "Usuário Rotas", email: `${unique()}@example.com`, password: unique(), administrador: "false", ...overrides };
}

export function productData(overrides = {}) {
  return { nome: `Produto Rotas ${unique()}`, preco: 125, descricao: "Produto de teste", quantidade: 10, ...overrides };
}

export function register(entity, body, token) {
  return request("POST", `/${entity}`, { body, token }).then((response) => {
    expect(response.status, `preparação: POST /${entity}`).to.eq(201);
    expect(response.body._id, "identificador").to.be.a("string").and.not.be.empty;
    state.cleanup[entity].push(entity === "carrinhos" ? token : response.body._id);
    return { ...body, _id: response.body._id };
  });
}

export function authenticate(admin = false) {
  return register("usuarios", userData({ administrador: String(admin) })).then((user) =>
    request("POST", "/login", { body: { email: user.email, password: user.password } }).then(({ status, body }) => {
      expect(status, "preparação: login").to.eq(200);
      expect(body.authorization).to.match(/^Bearer \S+$/);
      if (admin) state.adminToken = body.authorization;
      return { user, token: body.authorization };
    }),
  );
}

export function createProduct(overrides) {
  const create = (token) => register("produtos", productData(overrides), token);
  return state.adminToken ? create(state.adminToken) : authenticate(true).then(({ token }) => create(token));
}

export function createCart(products, token) {
  return register("carrinhos", { produtos: products }, token);
}

export function read(entity, id, status = 200) {
  return request("GET", pathFor(entity, id)).then((response) => {
    expect(response.status, `consulta de ${entity}`).to.eq(status);
    return response.body;
  });
}

export function list(entity, qs) {
  return request("GET", `/${entity}`, { qs }).then(({ status, body }) => {
    expect(status, `consulta de ${entity}`).to.eq(200);
    return body[entity];
  });
}

export function checkList(entity) {
  const body = state.response.body;
  expect(body[entity]).to.be.an("array");
  expect(body.quantidade).to.eq(body[entity].length);
}

export function checkFilter(entity, field, value) {
  checkList(entity);
  expect(state.response.body[entity]).not.to.be.empty;
  for (const item of state.response.body[entity]) expect(String(item[field])).to.eq(value);
}

Before(() => {
  state = { cleanup: { carrinhos: [], produtos: [], usuarios: [] } };
});

After(() => {
  const cleanup = (url, token) => request("DELETE", url, { token }).its("status").should("eq", 200);
  for (const token of state.cleanup.carrinhos) cleanup("/carrinhos/cancelar-compra", token);
  for (const id of state.cleanup.produtos) cleanup(pathFor("produtos", id), state.adminToken);
  for (const id of state.cleanup.usuarios) cleanup(pathFor("usuarios", id));
});

Then(/^a resposta deve ter status(?: code)? (\d+)$/, (status) => {
  expect(state.response.status).to.eq(Number(status));
});

Then("a mensagem deve ser {string}", (message) => expect(state.response.body.message).to.eq(message));
Then("a mensagem deve indicar que o cadastro foi realizado com sucesso", () => {
  expect(state.response.body.message).to.eq("Cadastro realizado com sucesso");
});
Then("a resposta deve indicar que o cadastro foi realizado com sucesso", () => {
  expect(state.response.body.message).to.eq("Cadastro realizado com sucesso");
});
Then("a resposta deve indicar que o registro foi excluído com sucesso", () => {
  expect(state.response.body.message).to.eq("Registro excluído com sucesso");
});
Then("a resposta deve indicar que o registro foi alterado com sucesso", () => {
  expect(state.response.body.message).to.eq("Registro alterado com sucesso");
});
Then(/^o corpo deve conter o identificador do novo (?:usuário|produto)$/, () => {
  expect(state.response.body._id).to.match(/^[a-zA-Z0-9]{16}$/);
});
