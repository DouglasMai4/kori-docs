---
title: Middleware
---

# Middleware

O Kori usa a mesma assinatura de middleware que o Chi e a biblioteca padrão:

```go
type Middleware = func(http.Handler) http.Handler
```

Este é um alias de tipo, não um novo tipo. Qualquer middleware `net/http` ou Chi existente funciona com o Kori sem adaptação.

## Middlewares padrão do Chi

Middlewares globais são registrados no router Chi com `r.Use`. Eles se aplicam a todos os handlers — tanto Chi quanto Kori:

```go
r := chi.NewRouter()

r.Use(middleware.RequestID)
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Use(middleware.Timeout(30 * time.Second))

kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

## Middleware no Kori

O Kori oferece duas formas de anexar middleware abaixo do nível global: por grupo e por rota.

## Middleware por grupo

Middlewares passados para `kori.Group` se aplicam a todas as rotas registradas naquele grupo:

```go
api := kori.Group(r, "/api", authMiddleware)

kori.GET(api, "/users", listUsers)   // authMiddleware aplicado
kori.POST(api, "/users", createUser) // authMiddleware aplicado
```

Múltiplos middlewares são passados em ordem:

```go
admin := kori.Group(r, "/admin", authMiddleware, auditMiddleware)

kori.GET(admin, "/stats", statsHandler)
kori.DELETE(admin, "/users/{id}", deleteUser)
```

## Middleware por rota

`kori.Use` anexa middleware a uma única rota. Ele retorna uma [Option](/ptbr/core-concepts/options) passada no momento do registro:

```go
kori.DELETE(r, "/admin/users/{id}", deleteUser,
    kori.Use(authMiddleware, auditMiddleware),
)
```

Múltiplas chamadas a `kori.Use` na mesma rota se compõem em ordem:

```go
kori.POST(r, "/payments", createPayment,
    kori.Use(authMiddleware),
    kori.Use(idempotencyMiddleware),
)
```

## Middleware global

Para middleware que deve executar em todas as requisições, use `r.Use` no router Chi raiz:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
```

## Precedência de middlewares

Os middlewares executam do mais externo para o mais interno. A ordem é:

1. Global (`r.Use`)
2. Nível de grupo (passado para `kori.Group`)
3. Nível de rota (`kori.Use`)

```go
r := chi.NewRouter()
r.Use(logMiddleware)           // 1. executa primeiro

api := kori.Group(r, "/api", authMiddleware)  // 2. executa segundo

kori.DELETE(api, "/users/{id}", deleteUser,
    kori.Use(auditMiddleware), // 3. executa terceiro
)
```
