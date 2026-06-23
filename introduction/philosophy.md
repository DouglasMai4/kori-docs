---
title: Philosophy
---

# Philosophy

Kori's design is guided by a small set of principles. Understanding them helps explain why the API looks the way it does and what tradeoffs were made deliberately.

## Explicit over magic

Go's `net/http` is explicit by design. Kori preserves that.

Every Kori handler has the same signature:

```go
func(w http.ResponseWriter, r *http.Request) error
```

There is no context injection, no custom `Context` type, no request/response wrappers. The `w` and `r` you already know are still the only way to read the request and write the response.

This means any Go developer can read a Kori handler without learning new abstractions, and any `net/http`-compatible tool — middleware, test helpers, tracing libraries — continues to work without changes.

## Built on standards

Kori does not reinvent what already exists. It connects existing, well-maintained pieces:

| Layer                             | Provided by                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| HTTP server and handler interface | `net/http` (stdlib)                                                     |
| Routing and middleware            | [Chi](https://github.com/go-chi/chi)                                    |
| Struct validation                 | [go-playground/validator](https://github.com/go-playground/validator)   |
| OpenAPI 3.1 spec generation       | [`kori/openapi`](https://github.com/douglasmai4/kori/tree/main/openapi) |

Each dependency was chosen because it is stable, idiomatic, and already widely used in the Go ecosystem. Kori's job is to wire them together cleanly, not to replace them.

## Small and focused

Kori deliberately avoids becoming a full-stack framework.

It is not:

- an ORM or database layer
- a dependency injection container
- a configuration loader
- a custom HTTP runtime
- a monolithic framework that owns the application lifecycle

The surface area is intentionally small. A smaller toolkit is easier to understand, easier to upgrade, and easier to move away from if your requirements change.

## Composable

Every feature in Kori can be adopted independently. There is no required initialization step and no global state that must be configured before the rest works.

You can use:

- **Only binding** — `BindJSON`, `BindQuery`, `BindPath` on any `*http.Request`
- **Only validation** — validation runs automatically inside every `Bind*` call
- **Only response helpers** — `JSON`, `Text`, `NoContent` on any `http.ResponseWriter`
- **Only error helpers** — `NotFound`, `BadRequest`, `Conflict`, and the `HTTPError` type work independently
- **Only OpenAPI** — `kori/openapi` is a separate module; it only adds what you import
- **Only SSE** — `NewSSEWriter` works with any handler

You are not required to adopt a specific project structure or initialize a central application object. Kori functions are plain functions — call the ones you need.

## Extensible through Options

Kori's extension point is the `Option` type:

```go
type Option func(*RouteInfo)
```

An `Option` receives the method and pattern of the route being registered. This is how `kori/openapi` attaches OpenAPI metadata — as an `Option` passed at route registration time — without any separate registration step.

You can write your own `Option` for route logging, permission metadata, or any other cross-cutting concern:

```go
func LogRoute(log *slog.Logger) kori.Option {
    return func(ri *kori.RouteInfo) {
        log.Info("route registered",
            "method", ri.Method,
            "pattern", ri.Pattern,
        )
    }
}

kori.GET(r, "/users", listUsers, LogRoute(log))
```

Options compose naturally — pass as many as needed, in any order.
