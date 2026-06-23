---
title: Options
---

# Options

Options are Kori's extension mechanism. They run at route registration time and can read or modify route metadata before the handler is registered with Chi.

## What are Options?

An `Option` is a function that receives a `*RouteInfo`:

```go
type Option func(*RouteInfo)
```

`RouteInfo` contains the resolved metadata for the route being registered:

```go
type RouteInfo struct {
    Method  string
    Pattern string
}
```

Every call to `kori.GET`, `kori.POST`, and similar functions accepts a variadic `...Option` as its last argument. Before registering the handler, Kori calls each option in order:

```go
kori.GET(r, "/users", listUsers, optionA, optionB, optionC)
//                                 ↑ called with RouteInfo{Method: "GET", Pattern: "/users"}
```

## Why Options exist

Options decouple route registration from route metadata. The handler itself knows nothing about OpenAPI, authorization policies, or audit requirements. Those concerns are expressed as options at the call site.

This design avoids two common alternatives:

- **Struct-based configuration** — requires instantiating a config object per route and makes the API verbose.
- **Global registries** — require maintaining a separate list of routes parallel to the routing table.

With Options, the declaration of a route and all its associated metadata live in one place.

## The built-in option: `Use`

`kori.Use` is the only built-in Option. It attaches middleware to a specific route:

```go
func Use(middlewares ...Middleware) Option {
    return func(ri *RouteInfo) {
        ri.middlewares = append(ri.middlewares, middlewares...)
    }
}
```

Usage:

```go
kori.GET(r, "/admin/stats", statsHandler, kori.Use(authMiddleware))
```

## Extending Kori

Any package can define its own `kori.Option` by returning `func(*kori.RouteInfo)`. The function receives `Method` and `Pattern` and can perform arbitrary logic at registration time: populate external registries, validate naming conventions, generate documentation.

A custom option that logs every registered route:

```go
func LogRoute(logger *slog.Logger) kori.Option {
    return func(ri *kori.RouteInfo) {
        logger.Info("route registered", "method", ri.Method, "pattern", ri.Pattern)
    }
}

kori.GET(r, "/users", listUsers, LogRoute(logger))
```

Because `Option` is a plain function type, options compose without any framework support:

```go
func Secure(mw ...kori.Middleware) kori.Option {
    return func(ri *kori.RouteInfo) {
        kori.Use(mw...)(ri)
        LogRoute(logger)(ri)
    }
}
```

## OpenAPI integration

The official `openapi` package demonstrates the full power of the Option system. `Spec.Route` returns a `kori.Option` that captures the route's method and pattern to build an OpenAPI 3.1 specification:

```go
doc := openapi.NewSpec(openapi.Config{
    Title:   "Users API",
    Version: "1.0.0",
})

kori.GET(r, "/users", listUsers, doc.Route(openapi.RouteConfig{
    Summary: "List users",
    Params:  &ListUsersParams{},
    Responses: map[int]any{
        200: &[]User{},
    },
}))

kori.POST(r, "/users", createUser, doc.Route(openapi.RouteConfig{
    Summary: "Create user",
    Body:    &CreateUserInput{},
    Responses: map[int]any{
        201: &User{},
    },
}))
```

Inside `Spec.Route`, the implementation is:

```go
func (s *Spec) Route(cfg RouteConfig) kori.Option {
    return func(ri *kori.RouteInfo) {
        op := s.buildOperation(ri.Method, ri.Pattern, cfg)
        // store op in the spec's internal path table
    }
}
```

`ri.Method` and `ri.Pattern` are the fully-resolved values Kori computed before calling the option — including the accumulated group prefix. The OpenAPI spec always receives the correct, fully-qualified path.

The spec can then be served at a dedicated endpoint:

```go
r.Get("/openapi.json", doc.JSONHandler())
r.Get("/openapi.yaml", doc.YAMLHandler())
r.Get("/docs", doc.ScalarHandler("/openapi.json"))
```

This entire integration — schema generation, parameter extraction, security requirements — is implemented outside of Kori's core, using only the public `Option` API.

## Options compose with other options

Multiple options on a single route are independent and all execute:

```go
kori.POST(r, "/users", createUser,
    kori.Use(authMiddleware),
    doc.Route(openapi.RouteConfig{
        Summary: "Create user",
        Body:    &CreateUserInput{},
        Responses: map[int]any{201: &User{}},
    }),
)
```

`kori.Use` attaches middleware to the route. `doc.Route` registers the route in the OpenAPI spec. Neither option is aware of the other.
