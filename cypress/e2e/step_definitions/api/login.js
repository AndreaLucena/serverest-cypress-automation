import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { register, send, state, userData } from "../../../support/api";

function registerCredentials() {
  return register("usuarios", userData()).then(({ email, password }) => {
    state.credentials = { email, password };
  });
}

function login(body = state.credentials) {
  return send("POST", "/login", { body });
}

function checkMessage(message) {
  expect(state.response.body.message).to.eq(message);
}

Given("que o usuário possui credenciais válidas", registerCredentials);
When(String.raw`é enviada uma requisição POST para \/login com email e password válidos`, login);
Then("deve ser gerado um token {string} válido por {int} segundos", (field, seconds) => {
  const token = state.response.body[field];
  expect(token, field).to.match(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  const [, payload] = token.split(".");
  const { iat, exp } = JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")));
  expect(exp - iat).to.eq(seconds);
  expect(exp).to.be.greaterThan(Math.floor(Date.now() / 1000));
});
Then("deve ser gerada mensagem {string}", checkMessage);

Given("que a requisição não informa email nem password", () => {
  state.credentials = {};
});
When(String.raw`é enviada uma requisição POST para \/login com o corpo JSON vazio`, login);
Then("o corpo deve indicar que email e password são obrigatórios", () => {
  expect(state.response.body).to.deep.include({
    email: "email é obrigatório",
    password: "password é obrigatório",
  });
});

Given("que o email possui formato válido mas não está cadastrado", () => {
  const { email, password } = userData();
  state.credentials = { email, password };
});
When(String.raw`é enviada uma requisição POST para \/login com esse email e um password preenchido`, login);
Then("deve ser exibida uma mensagem {string}", checkMessage);

Given("que existe um usuário cadastrado com email conhecido", registerCredentials);
When(String.raw`é enviada uma requisição POST para \/login com esse email e um password não vazio incorreto`, () =>
  login({ ...state.credentials, password: "senha-incorreta" }),
);
