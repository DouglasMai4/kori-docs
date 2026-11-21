---
title: Autenticação
description: Proteja rotas com um middleware de bearer token, erros 401/403 tipados e um esquema de segurança no OpenAPI.
---

O Kori não traz uma camada de autenticação: autenticação é middleware comum do Chi. O que o Kori adiciona é uma forma limpa de *rejeitar* requisições e de documentar o requisito no OpenAPI.

## O middleware

Um middleware é qualquer `func(http.Handler) http.Handler`. Como ele roda antes do handler Kori, escreve os erros pelo mesmo error handler das rotas, e todo 401 sai idêntico:

```go
package auth

import (
    "context"
    "net/http"
    "strings"

    "github.com/douglasmai4/kori"
)

type ctxKey struct{}

type User struct {
    ID    string
    Roles []string
}

func Bearer(verify func(token string) (*User, error)) kori.Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
            if !ok || raw == "" {
                kori.GetErrorHandler()(w, r, kori.Unauthorized("missing bearer token"))
                return
            }

            user, err := verify(raw)
            if err != nil {
                kori.GetErrorHandler()(w, r, kori.Unauthorized("invalid token"))
                return
            }

            ctx := context.WithValue(r.Context(), ctxKey{}, user)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func From(r *http.Request) *User {
    u, _ := r.Context().Value(ctxKey{}).(*User)
    return u
}
```

`kori.GetErrorHandler()` retorna o handler configurado: o JSON padrão ou o que você definiu com `SetErrorHandler`. Middleware e handlers ficam consistentes sem duplicar o formato da resposta.

## Protegendo um grupo

Anexe o middleware a um grupo para que toda rota sob o prefixo exija um token:

```go
api := kori.Group(r, "/api", auth.Bearer(verifyJWT))

kori.GET(api, "/me", func(w http.ResponseWriter, r *http.Request) error {
    return kori.JSON(w, http.StatusOK, auth.From(r))
})
```

## Checagem de papel por rota

Autorização costuma variar por rota. Use `kori.Use` para anexar a checagem a uma única rota:

```go
func RequireRole(role string) kori.Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            u := auth.From(r)
            if u == nil || !slices.Contains(u.Roles, role) {
                kori.GetErrorHandler()(w, r, kori.Forbidden("requires role "+role))
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

kori.DELETE(api, "/users/{id}", deleteUser, kori.Use(RequireRole("admin")))
```

A resposta quando falta o papel:

```json
{ "message": "requires role admin" }
```

## Documentando no OpenAPI

Registre o esquema uma vez, aplique globalmente e libere as rotas públicas:

```go
spec := openapi.NewSpec(openapi.Config{Title: "Users API", Version: "1.0.0"})
spec.AddSecurityScheme("bearer", openapi.BearerAuth("JWT"))
spec.SetGlobalSecurity(openapi.Require("bearer"))

kori.POST(r, "/login", login, spec.Route(openapi.RouteConfig{
    Summary:    "Exchange credentials for a token",
    Body:       &LoginInput{},
    Responses:  map[int]any{200: &TokenOutput{}},
    NoSecurity: true,
}))
```

Veja [Segurança](/pt-br/openapi/security) para API keys, OAuth 2.0 e OpenID Connect.
