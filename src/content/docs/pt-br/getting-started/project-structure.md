---
title: Estrutura de Projeto
---

O Kori não impõe nenhuma estrutura de projeto. Ele funciona com qualquer layout — um único `main.go`, um pacote flat ou uma arquitetura em camadas.

Esta página mostra uma estrutura que funciona bem para APIs pequenas a médias.

## Layout recomendado

```text
minha-api/
├── cmd/
│   └── api/
│       └── main.go          # ponto de entrada: configuração do router, start do servidor
├── internal/
│   ├── handler/
│   │   ├── user.go          # handlers HTTP para /users
│   │   └── post.go          # handlers HTTP para /posts
│   ├── service/
│   │   ├── user.go          # lógica de negócio
│   │   └── post.go
│   └── repository/
│       ├── user.go          # acesso a dados
│       └── post.go
├── go.mod
└── go.sum
```

## O que vai onde

**`cmd/api/main.go`** — cria o router, registra todas as rotas, inicia o servidor HTTP. Nada mais.

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/douglasmai4/kori"

    "minha-api/internal/handler"
    "minha-api/internal/repository"
    "minha-api/internal/service"
)

func main() {
    userRepo := repository.NewUserRepository()
    userSvc  := service.NewUserService(userRepo)
    userH    := handler.NewUserHandler(userSvc)

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    api := kori.Group(r, "/api/v1")
    kori.GET(api, "/users",         userH.List)
    kori.POST(api, "/users",        userH.Create)
    kori.GET(api, "/users/{id}",    userH.Get)
    kori.DELETE(api, "/users/{id}", userH.Delete)

    http.ListenAndServe(":8080", r)
}
```

**`internal/handler/user.go`** — handlers recebem suas dependências via struct. Sem estado global.

```go
package handler

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/douglasmai4/kori"

    "minha-api/internal/service"
)

type UserHandler struct {
    svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
    return &UserHandler{svc: svc}
}

type CreateUserBody struct {
    Name  string `json:"name"  validate:"required,min=2"`
    Email string `json:"email" validate:"required,email"`
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) error {
    users, err := h.svc.List(r.Context())
    if err != nil {
        return kori.InternalServerError("failed to list users")
    }
    return kori.JSON(w, http.StatusOK, users)
}

func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    user, err := h.svc.Get(r.Context(), id)
    if err != nil {
        return kori.NotFound("user not found")
    }
    return kori.JSON(w, http.StatusOK, user)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err
    }
    user, err := h.svc.Create(r.Context(), body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }
    return kori.JSON(w, http.StatusCreated, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    if err := h.svc.Delete(r.Context(), id); err != nil {
        return kori.NotFound("user not found")
    }
    return kori.NoContent(w)
}
```

## Observações

**O Kori funciona com qualquer arquitetura.** A divisão handler-service-repository acima é uma escolha comum, não um requisito. Alguns projetos colocam tudo em `main.go`; outros usam layouts orientados a domínio. O Kori se adapta ao que você já tem.

**Dependências via campos de struct**, não variáveis globais. Passar dependências através de construtores mantém os handlers testáveis — troque o serviço por um mock e teste o handler isoladamente.

**Mantenha o `main.go` focado na composição.** Registro de rotas, configuração de middleware e inicialização do servidor pertencem ali. Lógica de negócio pertence ao `internal`.
