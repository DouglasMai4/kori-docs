---
title: O que é o Kori?
---

# O que é o Kori?

O Kori é um toolkit para o [Chi](https://github.com/go-chi/chi) que reduz o boilerplate comum em serviços HTTP em Go — sem substituir nada em que você já depende.

`net/http`, Chi e middlewares padrão continuam funcionando exatamente como antes. O Kori constrói sobre eles.

## Quais problemas ele resolve?

Escrever handlers HTTP em Go com Chi é direto, mas os mesmos padrões se repetem em todo projeto:

- Decodificar o corpo da requisição e tratar o erro de decodificação
- Validar a struct, formatar e retornar os erros de validação
- Escrever a resposta com o `Content-Type` e o status code corretos
- Retornar o erro HTTP adequado em cada caso de borda

Nada disso é difícil, mas adiciona ruído a cada handler. O Kori remove esse ruído mantendo a estrutura familiar.

## O que o Kori adiciona

| Feature                          | Descrição                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Handlers com retorno de erro** | `Handler` é `func(w, r) error`. Retorne um erro; o Kori cuida da resposta.                                                                  |
| **Helpers de binding**           | `BindJSON`, `BindQuery`, `BindPath`, `BindHeader`, `BindForm`, `BindMultipart`                                                              |
| **Validação automática**         | Powered by [go-playground/validator](https://github.com/go-playground/validator). Entradas inválidas retornam respostas `422` estruturadas. |
| **Helpers de resposta**          | `JSON`, `Text`, `NoContent`, `Redirect`, `RawJSON`                                                                                          |
| **Erros HTTP tipados**           | `NotFound`, `BadRequest`, `Conflict`, `Unauthorized`, e mais                                                                                |
| **Groups**                       | `kori.Group` para sub-routers com prefixo e middleware de grupo                                                                             |
| **Middleware por rota**          | `kori.Use(...)` anexa middleware a uma única rota sem sub-router                                                                            |
| **SSE**                          | `SSEWriter` para Server-Sent Events                                                                                                         |
| **OpenAPI**                      | Módulo opcional `kori/openapi` gera specs OpenAPI 3.1 a partir das suas rotas                                                               |

## O que o Kori não substitui

O Kori não é um framework. Ele não substitui:

- **`net/http`** — `http.ResponseWriter` e `*http.Request` permanecem a assinatura da função
- **Chi** — roteamento, middleware, URL params e sub-routers continuam sendo Chi
- **Middlewares padrão** — qualquer `func(http.Handler) http.Handler` funciona sem alterações

O mesmo router pode servir handlers Chi padrão e handlers Kori lado a lado:

```go
r := chi.NewRouter()
r.Use(chimiddleware.Logger) // middleware Chi padrão

// handler Chi padrão — sem alterações
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// handler Kori no mesmo router
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

## Exemplo

Uma API pequena mas completa usando os recursos principais do Kori:

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/douglasmai4/kori"
)

type CreateUserBody struct {
    Name  string `json:"name"  validate:"required,min=2"`
    Email string `json:"email" validate:"required,email"`
}

type UserParams struct {
    ID string `path:"id" validate:"required,uuid4"`
}

func main() {
    r := chi.NewRouter()

    kori.GET(r, "/users/{id}", getUser)
    kori.POST(r, "/users", createUser)

    http.ListenAndServe(":8080", r)
}

func getUser(w http.ResponseWriter, r *http.Request) error {
    var p UserParams
    if err := kori.BindPath(r, &p); err != nil {
        return err // 422 com detalhes por campo
    }

    user, err := db.Find(p.ID)
    if err != nil {
        return kori.NotFound("user not found")
    }

    return kori.JSON(w, http.StatusOK, user)
}

func createUser(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 para JSON inválido, 422 para erros de validação
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }

    return kori.JSON(w, http.StatusCreated, user)
}
```

A assinatura do handler é `func(w http.ResponseWriter, r *http.Request) error` — um valor de retorno a mais, nada mais mudou.
