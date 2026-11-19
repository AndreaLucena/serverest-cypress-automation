
Feature: Autenticação de Usuários (Login)

#UC01 - Autenticar Usuário (POST /login): O usuário (administrador ou comum) envia suas credenciais (email e password) para validar sua identidade e obter um token JWT temporário (Bearer, válido por 600 segundos) necessário para operar rotas protegidas.

Scenario: CT01.1 - Autenticar usuário com sucesso
  Given que o usuário possui credenciais válidas
  When é enviada uma requisição POST para /login com email e password válidos
  Then a resposta deve ter status code 200
  And deve ser gerado um token "authorization" válido por 600 segundos
  And deve ser gerada mensagem "Login realizado com sucesso"

Scenario: CT01.2 - Rejeitar requisição sem email e password
  Given que a requisição não informa email nem password
  When é enviada uma requisição POST para /login com o corpo JSON vazio
  Then a resposta deve ter status code 400
  And o corpo deve indicar que email e password são obrigatórios

Scenario: CT01.3 - Falha ao autenticar usuário com credenciais inválidas - email
  Given que o email possui formato válido mas não está cadastrado
  When é enviada uma requisição POST para /login com esse email e um password preenchido
  Then a resposta deve ter status code 401
  And deve ser exibida uma mensagem "Email e/ou senha inválidos"

Scenario: CT01.4 - Falha ao autenticar usuário com credenciais inválidas - password
  Given que existe um usuário cadastrado com email conhecido
  When é enviada uma requisição POST para /login com esse email e um password não vazio incorreto
  Then a resposta deve ter status code 401
  And deve ser exibida uma mensagem "Email e/ou senha inválidos"