---
layout: home

hero:
  name: Kori
  text: O toolkit que faltava para o Chi
  tagline: Inspirado pelo Hono. Feito para Go idiomático.
  actions:
    - theme: brand
      text: Começar
      link: /ptbr/guide/getting-started
    - theme: alt
      text: Referência da API
      link: /ptbr/api/

features:
  - icon: 🧩
    title: Chi Nativo
    details: O Kori estende o Chi em vez de substitui-lo. Continue usando net/http, middlewares, routers e tudo que você já conhece.

  - icon: ↩️
    title: Retorno de Erro
    details: Retorne erros diretamente dos handlers. O Kori os converte em respostas HTTP consistentes automaticamente.

  - icon: 🔗
    title: Helpers de Binding
    details: Vincule dados da requisição via JSON, query strings, path params, headers, formulários e uploads multipart com uma única chamada.

  - icon: 🦺
    title: Validação Automática
    details: Powered by go-playground/validator. Requisições inválidas retornam automaticamente respostas 422 estruturadas.

  - icon: 📖
    title: OpenAPI Pronto
    details: Gere especificações OpenAPI diretamente das suas rotas usando o pacote oficial kori/openapi.

  - icon: 🔌
    title: Extensível via Options
    details: O tipo Option permite interceptar o registro de rotas - usado pelo kori/openapi, loggers de rota ou suas próprias ferramentas.
---
