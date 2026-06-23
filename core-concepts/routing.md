---
title: Routing
---

# Routing

Kori routes are registered on any `chi.Router`. The routing engine is Chi — Kori adds no router of its own.

## Registering routes

Every route registration follows the same signature:

```go
kori.METHOD(router, pattern, handler, ...options)
```

The router is always passed explicitly. Kori holds no global router state.

```go
r := chi.NewRouter()

kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

## HTTP methods

Kori exports a function for each HTTP method:

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

Chi's `{param}` syntax is used in patterns. Read a single parameter with `chi.URLParam`:

```go
func getUser(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    // use id...
    return kori.JSON(w, http.StatusOK, user)
}
```

When there are multiple parameters or you need type conversion and validation, use `kori.BindPath`:

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
    // p.UserID, p.PostID are decoded and validated
    return kori.JSON(w, http.StatusOK, post)
}
```

## Nested routes

Patterns can be nested using `kori.Group`. See [Groups](/core-concepts/groups) for details.

```go
api := kori.Group(r, "/api/v1")
kori.GET(api, "/users", listUsers)       // GET /api/v1/users
kori.GET(api, "/users/{id}", getUser)    // GET /api/v1/users/{id}
```

## Working with Chi

Because Kori registers routes on `chi.Router`, everything Chi supports is available: named parameters, wildcards, and sub-routers.

Standard Chi handlers coexist with Kori handlers on the same router:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)

// Standard Chi handler
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// Kori handler
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

Chi middleware applied via `r.Use(...)` wraps all handlers — both Chi and Kori.
