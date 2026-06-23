---
title: Roteamento
---

# Roteamento

O Kori registra rotas em qualquer `chi.Router`. Toda função de registro segue o mesmo formato:

```go
kori.METHOD(router, pattern, handler, ...options)
```

O router é sempre explícito — o Kori nunca guarda uma referência global a ele.

## Métodos HTTP

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

A sintaxe `{param}` do Chi é usada nos padrões. Leia-os com `chi.URLParam`:

```go
func getUser(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    // use id...
    return kori.JSON(w, http.StatusOK, user)
}
```

Quando há múltiplos parâmetros ou você precisa de validação, use `kori.BindPath`:

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
    // p.UserID, p.PostID
    return kori.JSON(w, http.StatusOK, post)
}
```

## Grupos de rotas

`kori.Group` cria um sub-router com um prefixo compartilhado. Middlewares passados ao `Group` se aplicam a todas as rotas do grupo.

```go
// Apenas prefixo
api := kori.Group(r, "/api/v1")
kori.GET(api, "/users", listUsers)
kori.POST(api, "/users", createUser)

// Prefixo + middleware
admin := kori.Group(r, "/admin", authMiddleware, auditMiddleware)
kori.GET(admin, "/stats", statsHandler)
kori.DELETE(admin, "/users/{id}", deleteUser)
```

Grupos aninhados:

```go
api := kori.Group(r, "/api")
v2  := kori.Group(api, "/v2")   // prefixo: /api/v2
kori.GET(v2, "/users", listUsersV2)
```

## Middleware por rota

Use `kori.Use(...)` para anexar middleware a uma única rota sem criar um sub-router:

```go
kori.DELETE(r, "/admin/users/{id}", deleteUser,
    kori.Use(authMiddleware, auditMiddleware),
)
```

Múltiplas options se compõem naturalmente:

```go
kori.POST(r, "/payments", createPayment,
    kori.Use(authMiddleware),
    kori.Use(idempotencyMiddleware),
)
```

## Coexistência com Chi puro

Handlers Chi padrão e handlers Kori coexistem no mesmo router:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)

// Chi puro — sem retorno de erro
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// handlers Kori
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```
