---
title: Grupos
---

# Grupos

`kori.Group` cria um sub-router com um prefixo de URL compartilhado e middlewares opcionais.

## Criando grupos

```go
func Group(r chi.Router, prefix string, middlewares ...Middleware) *kori.Router
```

Passe um `chi.Router` e um prefixo. O `*kori.Router` retornado incorpora `chi.Router`, portanto é um router válido para registros e aninhamentos posteriores.

```go
api := kori.Group(r, "/api")

kori.GET(api, "/users", listUsers)    // GET /api/users
kori.POST(api, "/users", createUser)  // POST /api/users
```

## Prefixos compartilhados

Rotas registradas em um grupo herdam seu prefixo automaticamente:

```go
r := chi.NewRouter()

api      := kori.Group(r, "/api")
users    := kori.Group(api, "/users")
products := kori.Group(api, "/products")

kori.GET(users, "", listUsers)          // GET /api/users
kori.GET(users, "/{id}", getUser)       // GET /api/users/{id}
kori.POST(users, "", createUser)        // POST /api/users

kori.GET(products, "", listProducts)    // GET /api/products
kori.GET(products, "/{id}", getProduct) // GET /api/products/{id}
```

## Middlewares compartilhados

Middlewares passados para `Group` se aplicam a todas as rotas registradas naquele grupo, e são herdados por qualquer grupo aninhado:

```go
api := kori.Group(r, "/api", authMiddleware, logMiddleware)

kori.GET(api, "/users", listUsers)   // authMiddleware + logMiddleware aplicados
kori.POST(api, "/users", createUser) // authMiddleware + logMiddleware aplicados
```

## Organizando APIs

Grupos se compõem naturalmente com aninhamento. Um padrão comum é uma API pública ao lado de uma seção administrativa protegida:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)

// Rotas públicas
kori.GET(r, "/health", healthCheck)

// API autenticada
api := kori.Group(r, "/api", authMiddleware)

kori.GET(api, "/todos", listTodos)
kori.POST(api, "/todos", createTodo)
kori.GET(api, "/todos/{id}", getTodo)
kori.PUT(api, "/todos/{id}", updateTodo)
kori.DELETE(api, "/todos/{id}", deleteTodo)

// Sub-grupo admin com middleware adicional
admin := kori.Group(api, "/admin", adminOnlyMiddleware)

kori.GET(admin, "/stats", statsHandler)
kori.DELETE(admin, "/users/{id}", deleteUser)
```

Resultado:

```
GET  /api/todos           → authMiddleware
POST /api/todos           → authMiddleware
GET  /api/todos/{id}      → authMiddleware
PUT  /api/todos/{id}      → authMiddleware
DELETE /api/todos/{id}    → authMiddleware
GET  /api/admin/stats     → authMiddleware + adminOnlyMiddleware
DELETE /api/admin/users/{id} → authMiddleware + adminOnlyMiddleware
```

## Middleware por rota

Middlewares também podem ser anexados a rotas individuais com `kori.Use`. Veja [Middleware](/ptbr/core-concepts/middleware) para mais detalhes.
