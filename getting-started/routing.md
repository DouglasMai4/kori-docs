---
title: Routing
---

# Routing

Kori registers routes on any `chi.Router`. Every registration function follows the same shape:

```go
kori.METHOD(router, pattern, handler, ...options)
```

The router is always explicit — Kori never holds a global reference to it.

## HTTP methods

```go
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
kori.PUT(r, "/users/{id}", replaceUser)
kori.PATCH(r, "/users/{id}", updateUser)
kori.DELETE(r, "/users/{id}", deleteUser)
kori.HEAD(r, "/users/{id}", headUser)
kori.OPTIONS(r, "/users", optionsUsers)
```

## Route parameters

Chi's `{param}` syntax is used in patterns. Read them with `chi.URLParam`:

```go
func getUser(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    // use id...
    return kori.JSON(w, http.StatusOK, user)
}
```

When there are multiple parameters or you need validation, use `kori.BindPath` instead:

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

## Route groups

`kori.Group` creates a sub-router with a shared prefix. Middleware passed to `Group` applies to every route in the group.

```go
// Prefix only
api := kori.Group(r, "/api/v1")
kori.GET(api, "/users", listUsers)
kori.POST(api, "/users", createUser)

// Prefix + middleware
admin := kori.Group(r, "/admin", authMiddleware, auditMiddleware)
kori.GET(admin, "/stats", statsHandler)
kori.DELETE(admin, "/users/{id}", deleteUser)
```

Groups nest:

```go
api := kori.Group(r, "/api")
v2  := kori.Group(api, "/v2")   // prefix: /api/v2
kori.GET(v2, "/users", listUsersV2)
```

## Per-route middleware

Use `kori.Use(...)` to attach middleware to a single route without creating a sub-router:

```go
kori.DELETE(r, "/admin/users/{id}", deleteUser,
    kori.Use(authMiddleware, auditMiddleware),
)
```

Multiple options compose naturally:

```go
kori.POST(r, "/payments", createPayment,
    kori.Use(authMiddleware),
    kori.Use(idempotencyMiddleware),
)
```

## Mixing with plain Chi

Standard Chi handlers and Kori handlers coexist on the same router:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)

// plain Chi — no error return
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// Kori handlers
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```
