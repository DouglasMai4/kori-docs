---
title: Authentication
description: Protect routes with a bearer-token middleware, typed 401/403 errors, and an OpenAPI security scheme.
---

Kori does not ship an auth layer — authentication is plain Chi middleware. What Kori adds is a clean way to *reject* requests and to document the requirement in OpenAPI.

## The middleware

A middleware is any `func(http.Handler) http.Handler`. Because it runs before the Kori handler, it writes errors through the same error handler your routes use, so every 401 looks identical:

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

`kori.GetErrorHandler()` returns whatever handler is configured — the default JSON one, or the one you set with `SetErrorHandler`. Middleware and handlers stay consistent without duplicating the response format.

## Protecting a group

Attach the middleware to a group so every route under the prefix requires a token:

```go
api := kori.Group(r, "/api", auth.Bearer(verifyJWT))

kori.GET(api, "/me", func(w http.ResponseWriter, r *http.Request) error {
    return kori.JSON(w, http.StatusOK, auth.From(r))
})
```

## Role checks per route

Authorization usually varies per route. Use `kori.Use` to attach a check to one route only:

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

The response for a missing role:

```json
{ "message": "requires role admin" }
```

## Documenting it in OpenAPI

Register the scheme once, apply it globally, and opt public routes out:

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

See [Security](/openapi/security) for API keys, OAuth 2.0 and OpenID Connect.
