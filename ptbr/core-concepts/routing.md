---
title: Roteamento
---

# Roteamento

As rotas do Kori são registradas em qualquer `chi.Router`. O motor de roteamento é o Chi — o Kori não possui um router próprio.

## Registrando rotas

Todo registro de rota segue a mesma assinatura:

```go
kori.MÉTODO(router, padrão, handler, ...opções)
```

O router é sempre passado explicitamente. O Kori não mantém estado global de router.

```go
r := chi.NewRouter()

kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

## Métodos HTTP

O Kori exporta uma função para cada método HTTP:

```go
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
kori.PUT(r, "/users/{id}", replaceUser)
kori.PATCH(r, "/users/{id}", updateUser)
kori.DELETE(r, "/users/{id}", deleteUser)
kori.HEAD(r, "/users/{id}", headUser)
kori.OPTIONS(r, "/users", optionsUsers)
```

## Parâmetros de rota

A sintaxe `{param}` do Chi é utilizada nos padrões. Leia um único parâmetro com `chi.URLParam`:

```go
func getUser(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    // use id...
    return kori.JSON(w, http.StatusOK, user)
}
```

Quando há múltiplos parâmetros ou você precisa de conversão de tipo e validação, use `kori.BindPath`:

```go
type PostParams struct {
    UserID string `path:"user_id" validate:"required,uuid4"`
    PostID string `path:"post_id" validate:"required,uuid4"`
}

func getPost(w http.ResponseWriter, r *http.Request) error {
    var p PostParams
    if err := kori.BindPath(r, &p); err != nil {
        return err
    }
    // p.UserID e p.PostID estão decodificados e validados
    return kori.JSON(w, http.StatusOK, post)
}
```

## Rotas aninhadas

Os padrões podem ser aninhados com `kori.Group`. Veja [Grupos](/ptbr/core-concepts/groups) para mais detalhes.

```go
api := kori.Group(r, "/api/v1")
kori.GET(api, "/users", listUsers)       // GET /api/v1/users
kori.GET(api, "/users/{id}", getUser)    // GET /api/v1/users/{id}
```

## Trabalhando com Chi

Como o Kori registra rotas em `chi.Router`, tudo que o Chi suporta está disponível: parâmetros nomeados, wildcards e sub-routers.

Handlers Chi padrão coexistem com handlers Kori no mesmo router:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)

// Handler Chi padrão
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// Handlers Kori
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

Middlewares Chi aplicados via `r.Use(...)` envolvem todos os handlers — tanto Chi quanto Kori.
