---
title: openapi package
description: Every exported function and type in github.com/douglasmai4/kori/openapi.
tableOfContents:
  maxHeadingLevel: 3
---

```go
import "github.com/douglasmai4/kori/openapi"
```

Builds an OpenAPI 3.1 document from routes registered with Kori. The package is optional and lives in its own module.

## Spec

### NewSpec

```go
func NewSpec(cfg Config) *Spec
```

Creates the spec builder.

```go
spec := openapi.NewSpec(openapi.Config{
    Title:   "Todos API",
    Version: "1.0.0",
})
```

### Config

```go
type Config struct {
    Title       string
    Version     string
    Description string
    Servers     []Server
}

type Server struct {
    URL         string `json:"url"`
    Description string `json:"description,omitempty"`
}
```

### Spec.Route

```go
func (s *Spec) Route(cfg RouteConfig) kori.Option
```

Returns a `kori.Option` that adds the route to the document. Pass it as the last argument to any method function.

```go
kori.GET(r, "/todos", listTodos, spec.Route(openapi.RouteConfig{
    Summary:   "List all todos",
    Params:    &ListParams{},
    Responses: map[int]any{200: &TodoList{}},
}))
```

### RouteConfig

```go
type RouteConfig struct {
    OperationID string
    Summary     string
    Description string
    Tags        []string
    Deprecated  bool
    Params      any
    Body        any
    Responses   map[int]any
    Security    []SecurityRequirement
    NoSecurity  bool
}
```

| Field | Purpose |
| --- | --- |
| `OperationID` | Explicit operation id. Generated from method and path when empty. |
| `Params` | Pointer to a struct with `path`, `query` and `header` tags. Each field becomes a parameter. |
| `Body` | Pointer to the JSON request body type. |
| `Responses` | Status code → response type. `nil` documents a response with no body. |
| `Security` | Overrides the global security for this route. |
| `NoSecurity` | Marks the route as public even when global security is set. |

### Serving the document

```go
func (s *Spec) JSONHandler() http.HandlerFunc
func (s *Spec) YAMLHandler() http.HandlerFunc
func (s *Spec) ScalarHandler(specURL string, opts ...ScalarOptions) http.HandlerFunc
```

```go
r.Get("/openapi.json", spec.JSONHandler())
r.Get("/openapi.yaml", spec.YAMLHandler())
r.Get("/docs", spec.ScalarHandler("/openapi.json"))
```

`ScalarHandler` serves an HTML page that loads [Scalar](https://scalar.com) from jsDelivr and points it at `specURL`.

### ScalarOptions

```go
type ScalarOptions struct {
    Theme              string // defaults to "default"
    DarkMode           bool
    HideModels         bool
    HideDownloadButton bool
    DefaultOpenAllTags bool
    CustomCSS          string
}
```

## Schema tags

Struct types are converted by reflection and registered once under `#/components/schemas`.

| Tag | Effect |
| --- | --- |
| `json` | Property name; `json:"-"` omits the field |
| `path`, `query`, `header` | Parameter name and location inside `Params` |
| `validate` | Adds `required`, length, range, `format` and `enum` constraints |
| `doc` | Sets `description` |
| `example` | Sets `example`, typed to the field |

See [Schema generation](/openapi/schemas) for the full `validate` mapping.

## Security

### Schemes

```go
func BearerAuth(bearerFormat ...string) SecurityScheme
func BasicAuth() SecurityScheme
func APIKeyAuth(name string, in APIKeyLocation) SecurityScheme
func OAuth2(flows OAuthFlows) SecurityScheme
func OpenIDConnect(discoveryURL string) SecurityScheme
```

```go
type APIKeyLocation string

const (
    InHeader APIKeyLocation = "header"
    InQuery  APIKeyLocation = "query"
    InCookie APIKeyLocation = "cookie"
)
```

### Registering and requiring

```go
func (s *Spec) AddSecurityScheme(name string, scheme SecurityScheme)
func (s *Spec) SetGlobalSecurity(reqs ...SecurityRequirement)

func Require(schemes ...string) SecurityRequirement
func RequireScopes(scheme string, scopes ...string) SecurityRequirement
```

```go
spec.AddSecurityScheme("bearer", openapi.BearerAuth("JWT"))
spec.AddSecurityScheme("apiKey", openapi.APIKeyAuth("X-API-Key", openapi.InHeader))
spec.SetGlobalSecurity(openapi.Require("bearer"))
```

Several requirements in one slice mean *any of* them; several schemes inside one `Require` mean *all of* them.

### OAuth types

```go
type OAuthFlows struct {
    Implicit          *OAuthFlow
    Password          *OAuthFlow
    ClientCredentials *OAuthFlow
    AuthorizationCode *OAuthFlow
}

type OAuthFlow struct {
    AuthorizationURL string
    TokenURL         string
    RefreshURL       string
    Scopes           map[string]string
}
```

## Document types

These mirror the OpenAPI 3.1 objects and are exported for inspection and tooling. You rarely build them by hand.

| Type | OpenAPI object |
| --- | --- |
| `Operation` | Operation |
| `Parameter` | Parameter (`in`: path, query, header) |
| `RequestBody` | Request Body |
| `Response`, `Responses` | Response, Responses |
| `MediaType` | Media Type |
| `Schema` | Schema (3.1, `type` may be a list for nullable) |
| `SecurityScheme` | Security Scheme |
| `SecurityRequirement` | Security Requirement |
