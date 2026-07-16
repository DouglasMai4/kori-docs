---
title: Security
---

# Security

Security in `kori/openapi` has two parts: **schemes**, which define *how* a client authenticates, and **requirements**, which declare *which* schemes an operation needs. You register schemes once on the spec, then apply requirements globally or per route.

Documenting security describes your API in the spec it doesn't enforce anything. The actual check still lives in [middleware](/core-concepts/middleware); the spec just tells clients and the UI what to send.

## Registering schemes

`AddSecurityScheme` registers a named scheme under `#/components/securitySchemes/`. The name is how you reference it in requirements later:

```go
spec := kopenapi.NewSpec(kopenapi.Config{Title: "My API", Version: "1.0.0"})

spec.AddSecurityScheme("bearer", kopenapi.BearerAuth("JWT"))
spec.AddSecurityScheme("apiKey", kopenapi.APIKeyAuth("X-Api-Key", kopenapi.InHeader))
```

### Scheme constructors

| Constructor | Sends | OpenAPI `type` |
| --- | --- | --- |
| `BearerAuth(format...)` | `Authorization: Bearer <token>` | `http` / `bearer` |
| `BasicAuth()` | `Authorization: Basic <base64>` | `http` / `basic` |
| `APIKeyAuth(name, in)` | A key in a header, query param, or cookie | `apiKey` |
| `OAuth2(flows)` | OAuth 2.0 flows | `oauth2` |
| `OpenIDConnect(discoveryURL)` | OpenID Connect discovery | `openIdConnect` |

`BearerAuth` takes an optional format hint (`"JWT"`) that surfaces in the UI. `APIKeyAuth` takes the key name and a location `kopenapi.InHeader`, `kopenapi.InQuery`, or `kopenapi.InCookie`.

## Requirements

A `SecurityRequirement` lists the schemes an operation accepts. Build one with `Require` or `RequireScopes`:

```go
kopenapi.Require("bearer")               // bearer, no scopes
kopenapi.Require("bearer", "apiKey")     // ANY of the listed schemes (OR)
kopenapi.RequireScopes("oauth", "read")  // OAuth2 with required scopes
```

A single `Require` with multiple names means *any one* of those schemes satisfies the requirement. To require *both* schemes at once (AND), pass two separate requirements but the common case is a single scheme or a short OR list.

## Global security

`SetGlobalSecurity` applies one or more requirements to every documented operation by default:

```go
spec.SetGlobalSecurity(kopenapi.Require("bearer"))
```

From here on, each operation inherits `bearer` unless it opts out or overrides so you declare the common case once instead of repeating it on every route.

## Per-route overrides

Two `RouteConfig` fields adjust security for a single operation:

- **`Security`** replaces the global requirement for that operation.
- **`NoSecurity`** marks the operation as public, emitting an empty `security: []` that overrides the global default.

```go
// Override: this endpoint uses the API key instead of the global bearer
kori.DELETE(api, "/projects/{id}", deleteProject,
    kori.Use(apiKeyAuth),
    spec.Route(kopenapi.RouteConfig{
        Summary:  "Delete project",
        Security: []kopenapi.SecurityRequirement{kopenapi.Require("apiKey")},
        // ...
    }),
)

// Public: no auth, even though the global default is bearer
kori.GET(api, "/projects", listProjects,
    spec.Route(kopenapi.RouteConfig{
        Summary:    "List projects",
        NoSecurity: true,
        // ...
    }),
)
```

`NoSecurity` and `Security` describe the operation in the spec; pair them with the matching middleware so the documentation and the enforcement agree.

## Full example

A Projects API with a global bearer default, one public endpoint, and a per-route API-key override:

```go
spec := kopenapi.NewSpec(kopenapi.Config{Title: "Projects API", Version: "1.0.0"})

spec.AddSecurityScheme("bearer", kopenapi.BearerAuth("JWT"))
spec.AddSecurityScheme("apiKey", kopenapi.APIKeyAuth("X-Api-Key", kopenapi.InHeader))
spec.SetGlobalSecurity(kopenapi.Require("bearer"))

api := kori.Group(r, "/api")

// Public clears the global bearer requirement
kori.GET(api, "/projects", listProjects(store),
    spec.Route(kopenapi.RouteConfig{
        Summary:    "List projects",
        Tags:       []string{"projects"},
        Responses:  map[int]any{200: []*Project{}},
        NoSecurity: true,
    }),
)

// Inherits global bearer
kori.POST(api, "/projects", createProject(store),
    kori.Use(bearerAuth),
    spec.Route(kopenapi.RouteConfig{
        Summary:   "Create project",
        Tags:      []string{"projects"},
        Body:      CreateProjectBody{},
        Responses: map[int]any{201: Project{}, 422: kori.HTTPError{}},
    }),
)

// Overrides global bearer with the API key
kori.DELETE(api, "/projects/{id}", deleteProject(store),
    kori.Use(apiKeyAuth),
    spec.Route(kopenapi.RouteConfig{
        Summary:  "Delete project",
        Tags:     []string{"projects"},
        Params:   ProjectIDParams{},
        Security: []kopenapi.SecurityRequirement{kopenapi.Require("apiKey")},
        Responses: map[int]any{
            204: nil,
            401: kori.HTTPError{},
            404: kori.HTTPError{},
        },
    }),
)
```

The generated spec carries the two schemes under `components.securitySchemes`, a top-level `security` requiring `bearer`, and per-operation `security` for the public and API-key routes.
