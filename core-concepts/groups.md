---
title: Groups
---

# Groups

`kori.Group` creates a sub-router with a shared URL prefix and optional middleware.

## Creating groups

```go
func Group(r chi.Router, prefix string, middlewares ...Middleware) *kori.Router
```

Pass a `chi.Router` and a prefix. The returned `*kori.Router` embeds `chi.Router`, so it is a valid router for further registrations and nesting.

```go
api := kori.Group(r, "/api")

kori.GET(api, "/users", listUsers)    // GET /api/users
kori.POST(api, "/users", createUser)  // POST /api/users
```

## Shared prefixes

Routes registered on a group inherit its prefix automatically:

```go
r := chi.NewRouter()

api      := kori.Group(r, "/api")
users    := kori.Group(api, "/users")
products := kori.Group(api, "/products")

kori.GET(users, "/", listUsers)          // GET /api/users
kori.GET(users, "/{id}", getUser)       // GET /api/users/{id}
kori.POST(users, "/", createUser)        // POST /api/users

kori.GET(products, "/", listProducts)    // GET /api/products
kori.GET(products, "/{id}", getProduct) // GET /api/products/{id}
```

## Shared middleware

Middleware passed to `Group` applies to every route in that group, and is inherited by any nested group:

```go
api := kori.Group(r, "/api", authMiddleware, logMiddleware)

kori.GET(api, "/users", listUsers)   // authMiddleware + logMiddleware apply
kori.POST(api, "/users", createUser) // authMiddleware + logMiddleware apply
```

## Organizing APIs

Groups compose naturally with nesting. A common pattern is a public API alongside a protected admin section:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)

// Public routes
kori.GET(r, "/health", healthCheck)

// Authenticated API
api := kori.Group(r, "/api", authMiddleware)

kori.GET(api, "/todos", listTodos)
kori.POST(api, "/todos", createTodo)
kori.GET(api, "/todos/{id}", getTodo)
kori.PUT(api, "/todos/{id}", updateTodo)
kori.DELETE(api, "/todos/{id}", deleteTodo)

// Admin sub-group with additional middleware
admin := kori.Group(api, "/admin", adminOnlyMiddleware)

kori.GET(admin, "/stats", statsHandler)
kori.DELETE(admin, "/users/{id}", deleteUser)
```

This produces:

```
GET  /api/todos           → authMiddleware
POST /api/todos           → authMiddleware
GET  /api/todos/{id}      → authMiddleware
PUT  /api/todos/{id}      → authMiddleware
DELETE /api/todos/{id}    → authMiddleware
GET  /api/admin/stats     → authMiddleware + adminOnlyMiddleware
DELETE /api/admin/users/{id} → authMiddleware + adminOnlyMiddleware
```

## Per-route middleware

Middleware can also be attached to individual routes using `kori.Use`. See [Middleware](/core-concepts/middleware) for details.
