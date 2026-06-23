---
title: Middleware
---

# Middleware

Kori uses the same middleware signature as Chi and the standard library:

```go
type Middleware = func(http.Handler) http.Handler
```

This is a type alias, not a new type. Any existing `net/http` or Chi middleware works with Kori without adaptation.

## Standard Chi middleware

Global middleware is registered on the Chi router with `r.Use`. It applies to all handlers — both Chi and Kori:

```go
r := chi.NewRouter()

r.Use(middleware.RequestID)
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Use(middleware.Timeout(30 * time.Second))

kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

## Middleware in Kori

Kori provides two ways to attach middleware below the global level: per-group and per-route.

## Group-level middleware

Middleware passed to `kori.Group` applies to every route registered under that group:

```go
api := kori.Group(r, "/api", authMiddleware)

kori.GET(api, "/users", listUsers)   // authMiddleware applies
kori.POST(api, "/users", createUser) // authMiddleware applies
```

Multiple middleware functions are passed in order:

```go
admin := kori.Group(r, "/admin", authMiddleware, auditMiddleware)

kori.GET(admin, "/stats", statsHandler)
kori.DELETE(admin, "/users/{id}", deleteUser)
```

## Route-level middleware

`kori.Use` attaches middleware to a single route. It returns an [Option](/core-concepts/options) passed at registration time:

```go
kori.DELETE(r, "/admin/users/{id}", deleteUser,
    kori.Use(authMiddleware, auditMiddleware),
)
```

Multiple `kori.Use` calls on the same route compose in order:

```go
kori.POST(r, "/payments", createPayment,
    kori.Use(authMiddleware),
    kori.Use(idempotencyMiddleware),
)
```

## Global middleware

For middleware that must run on every request, use `r.Use` on the root Chi router:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
```

## Middleware precedence

Middleware executes from outermost to innermost. The order is:

1. Global (`r.Use`)
2. Group-level (passed to `kori.Group`)
3. Route-level (`kori.Use`)

```go
r := chi.NewRouter()
r.Use(logMiddleware)           // 1. runs first

api := kori.Group(r, "/api", authMiddleware)  // 2. runs second

kori.DELETE(api, "/users/{id}", deleteUser,
    kori.Use(auditMiddleware), // 3. runs third
)
```
