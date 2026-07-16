---
title: OpenAPI
---

# OpenAPI

`kori/openapi` generates an OpenAPI 3.1 specification from the same Go structs you already use for binding and validation. It hooks into Kori's [Option](/core-concepts/options) system, so documenting a route happens right next to registering it, no CLI step, no YAML files kept in sync by hand, no schema duplicated between code and docs.

Because it is built entirely on the public `Option` API, the module lives in its own package and Kori's core knows nothing about it. It is opt-in per route: routes without a `spec.Route(...)` option are simply left out of the spec.

## Installation

```bash
go get github.com/douglasmai4/kori/openapi
```

It requires `github.com/douglasmai4/kori` and Go 1.26+.

## Quick start

Create a `Spec`, attach a `spec.Route(...)` option to each route you want documented, and serve the result:

```go
package main

import (
    "net/http"

    "github.com/douglasmai4/kori"
    kopenapi "github.com/douglasmai4/kori/openapi"
    "github.com/go-chi/chi/v5"
)

type Todo struct {
    ID    int    `json:"id"`
    Title string `json:"title"`
    Done  bool   `json:"done"`
}

func main() {
    spec := kopenapi.NewSpec(kopenapi.Config{
        Title:   "Todo API",
        Version: "1.0.0",
    })

    r := chi.NewRouter()

    kori.GET(r, "/todos", listTodos,
        spec.Route(kopenapi.RouteConfig{
            Summary: "List todos",
            Tags:    []string{"todos"},
            Responses: map[int]any{
                200: []Todo{},
            },
        }),
    )

    // Serve the spec and an interactive UI
    r.Get("/openapi.json", spec.JSONHandler())
    r.Get("/docs", spec.ScalarHandler("/openapi.json"))

    http.ListenAndServe(":8080", r)
}
```

`spec.Route` returns a `kori.Option`, so it goes in the same variadic slot as `kori.Use`, as the last argument to any `kori.GET`, `kori.POST`, and so on. At registration time it reads the route's resolved method and pattern (including any [group](/core-concepts/groups) prefix) and records an operation in the spec.

The three pieces that follow cover the rest of the module:

- [Documenting Routes](/openapi/routes) - the fields of `RouteConfig`, and how params, bodies, and responses become operations.
- [Schema Generation](/openapi/schemas) - how Go structs and their tags turn into JSON schemas.
- [Security](/openapi/security) - declaring auth schemes and applying them globally or per route.

## Config

`NewSpec` takes the top-level document metadata:

```go
spec := kopenapi.NewSpec(kopenapi.Config{
    Title:       "Todo API",
    Version:     "1.0.0",
    Description: "A simple todo API.",
    Servers: []kopenapi.Server{
        {URL: "https://api.example.com", Description: "Production"},
        {URL: "http://localhost:8080", Description: "Local"},
    },
})
```

Only `Title` and `Version` are required by the OpenAPI spec; `Description` and `Servers` are optional.

## Serving the spec

The `Spec` builds the document lazily on each request, so any route you register, even after the handlers are wired, is reflected. Two handlers serialize it:

```go
r.Get("/openapi.json", spec.JSONHandler())
r.Get("/openapi.yaml", spec.YAMLHandler())
```

Both are plain `http.HandlerFunc` values, so they mount on any `chi.Router` (or `net/http` mux) without going through `kori.GET` they are not part of your documented API.

## Scalar UI

[Scalar](https://scalar.com) is an API reference UI, like Swagger UI but faster and cleaner. `ScalarHandler` serves a ready-made page that loads your spec from the URL you pass:

```go
r.Get("/docs", spec.ScalarHandler("/openapi.json"))
```

The argument is the URL where the spec JSON is served, not the spec itself, Scalar fetches it from the browser. Pass a `ScalarOptions` to customize the page:

```go
r.Get("/docs", spec.ScalarHandler("/openapi.json", kopenapi.ScalarOptions{
    Theme:              "purple",
    DarkMode:           true,
    HideModels:         false,
    HideDownloadButton: false,
    DefaultOpenAllTags: true,
    CustomCSS:          "body { background: #111; }",
}))
```

| Option | Effect |
| --- | --- |
| `Theme` | Scalar theme name (e.g. `"purple"`, `"default"`) |
| `DarkMode` | Start in dark mode |
| `HideModels` | Hide the schema models section |
| `HideDownloadButton` | Hide the spec download button |
| `DefaultOpenAllTags` | Expand every tag group by default |
| `CustomCSS` | Extra CSS injected into the page |

## Coexistence with plain Chi

The module never takes over routing it observes registrations through the `Option` seam. A route registered without `spec.Route(...)`, or one registered with `r.Get` directly, is invisible to the spec:

```go
r.Get("/health", healthHandler)                   // undocumented
kori.GET(r, "/todos", listTodos, spec.Route(cfg)) // documented
```

This lets you document your public API surface while leaving health checks, internal endpoints, and the spec handlers themselves out of it.
