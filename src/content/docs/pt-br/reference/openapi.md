---
title: Pacote openapi
description: Todas as funções e tipos exportados de github.com/douglasmai4/kori/openapi.
tableOfContents:
  maxHeadingLevel: 3
---

```go
import "github.com/douglasmai4/kori/openapi"
```

Gera um documento OpenAPI 3.1 a partir das rotas registradas com o Kori. O pacote é opcional e fica em um módulo próprio.

## Spec

### NewSpec

```go
func NewSpec(cfg Config) *Spec
```

Cria o construtor da spec.

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

Retorna uma `kori.Option` que adiciona a rota ao documento. Passe como último argumento de qualquer função de método.

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

| Campo | Função |
| --- | --- |
| `OperationID` | Operation id explícito. Gerado a partir do método e do path quando vazio. |
| `Params` | Ponteiro para struct com tags `path`, `query` e `header`. Cada campo vira um parâmetro. |
| `Body` | Ponteiro para o tipo do body JSON. |
| `Responses` | Status → tipo da resposta. `nil` documenta uma resposta sem body. |
| `Security` | Sobrescreve a segurança global nesta rota. |
| `NoSecurity` | Marca a rota como pública mesmo com segurança global definida. |

### Servindo o documento

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

`ScalarHandler` serve uma página HTML que carrega o [Scalar](https://scalar.com) via jsDelivr apontando para `specURL`. Usa o tema kori por padrão; `CustomCSS` é aplicado depois do tema.

### ScalarOptions

```go
type ScalarOptions struct {
    Theme              string // padrão: "kori"
    DarkMode           bool
    HideModels         bool
    HideDownloadButton bool
    DefaultOpenAllTags bool
    CustomCSS          string
}
```

## Tags de schema

Structs são convertidas por reflection e registradas uma vez em `#/components/schemas`.

| Tag | Efeito |
| --- | --- |
| `json` | Nome da propriedade; `json:"-"` omite o campo |
| `path`, `query`, `header` | Nome e local do parâmetro dentro de `Params` |
| `validate` | Adiciona `required`, tamanho, intervalo, `format` e `enum` |
| `doc` | Define `description` |
| `example` | Define `example`, tipado conforme o campo |

Veja [Geração de schemas](/pt-br/openapi/schemas) para o mapeamento completo de `validate`.

## Segurança

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

### Registrando e exigindo

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

Vários requisitos no slice significam *qualquer um* deles; vários esquemas dentro de um `Require` significam *todos* eles.

### Tipos OAuth

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

## Tipos do documento

Espelham os objetos do OpenAPI 3.1 e são exportados para inspeção e ferramentas. Raramente você os monta à mão.

| Tipo | Objeto OpenAPI |
| --- | --- |
| `Operation` | Operation |
| `Parameter` | Parameter (`in`: path, query, header) |
| `RequestBody` | Request Body |
| `Response`, `Responses` | Response, Responses |
| `MediaType` | Media Type |
| `Schema` | Schema (3.1, `type` pode ser lista para nullable) |
| `SecurityScheme` | Security Scheme |
| `SecurityRequirement` | Security Requirement |
