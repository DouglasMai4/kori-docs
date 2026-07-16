---
title: Segurança
---

# Segurança

Segurança no `kori/openapi` tem duas partes: **esquemas**, que definem *como* um cliente se autentica, e **requisitos**, que declaram *quais* esquemas uma operação precisa. Você registra esquemas uma vez na especificação e depois aplica requisitos globalmente ou por rota.

Documentar segurança descreve sua API na especificação não impõe nada. A verificação de fato continua vivendo no [middleware](/ptbr/core-concepts/middleware); a especificação apenas informa aos clientes e à UI o que enviar.

## Registrando esquemas

`AddSecurityScheme` registra um esquema nomeado sob `#/components/securitySchemes/`. O nome é como você o referencia nos requisitos depois:

```go
spec := kopenapi.NewSpec(kopenapi.Config{Title: "My API", Version: "1.0.0"})

spec.AddSecurityScheme("bearer", kopenapi.BearerAuth("JWT"))
spec.AddSecurityScheme("apiKey", kopenapi.APIKeyAuth("X-Api-Key", kopenapi.InHeader))
```

### Construtores de esquema

| Construtor | Envia | `type` OpenAPI |
| --- | --- | --- |
| `BearerAuth(format...)` | `Authorization: Bearer <token>` | `http` / `bearer` |
| `BasicAuth()` | `Authorization: Basic <base64>` | `http` / `basic` |
| `APIKeyAuth(name, in)` | Uma chave num header, query param ou cookie | `apiKey` |
| `OAuth2(flows)` | Fluxos OAuth 2.0 | `oauth2` |
| `OpenIDConnect(discoveryURL)` | Discovery do OpenID Connect | `openIdConnect` |

`BearerAuth` recebe uma dica de formato opcional (`"JWT"`) que aparece na UI. `APIKeyAuth` recebe o nome da chave e uma localização `kopenapi.InHeader`, `kopenapi.InQuery` ou `kopenapi.InCookie`.

## Requisitos

Um `SecurityRequirement` lista os esquemas que uma operação aceita. Construa um com `Require` ou `RequireScopes`:

```go
kopenapi.Require("bearer")               // bearer, sem scopes
kopenapi.Require("bearer", "apiKey")     // QUALQUER um dos esquemas listados (OU)
kopenapi.RequireScopes("oauth", "read")  // OAuth2 com scopes obrigatórios
```

Um único `Require` com vários nomes significa que *qualquer um* desses esquemas satisfaz o requisito. Para exigir *ambos* os esquemas ao mesmo tempo (E), passe dois requisitos separados mas o caso comum é um único esquema ou uma pequena lista OU.

## Segurança global

`SetGlobalSecurity` aplica um ou mais requisitos a toda operação documentada por padrão:

```go
spec.SetGlobalSecurity(kopenapi.Require("bearer"))
```

Daí em diante, cada operação herda `bearer` a menos que opte por sair ou sobrescreva então você declara o caso comum uma vez em vez de repeti-lo em cada rota.

## Sobrescritas por rota

Dois campos do `RouteConfig` ajustam a segurança de uma única operação:

- **`Security`** substitui o requisito global para aquela operação.
- **`NoSecurity`** marca a operação como pública, emitindo um `security: []` vazio que sobrescreve o padrão global.

```go
// Sobrescrita: este endpoint usa a chave de API em vez do bearer global
kori.DELETE(api, "/projects/{id}", deleteProject,
    kori.Use(apiKeyAuth),
    spec.Route(kopenapi.RouteConfig{
        Summary:  "Delete project",
        Security: []kopenapi.SecurityRequirement{kopenapi.Require("apiKey")},
        // ...
    }),
)

// Pública: sem autenticação, mesmo com o padrão global sendo bearer
kori.GET(api, "/projects", listProjects,
    spec.Route(kopenapi.RouteConfig{
        Summary:    "List projects",
        NoSecurity: true,
        // ...
    }),
)
```

`NoSecurity` e `Security` descrevem a operação na especificação; combine-os com o middleware correspondente para que a documentação e a imposição concordem.

## Exemplo completo

Uma API de Projects com um padrão global bearer, um endpoint público e uma sobrescrita de chave de API por rota:

```go
spec := kopenapi.NewSpec(kopenapi.Config{Title: "Projects API", Version: "1.0.0"})

spec.AddSecurityScheme("bearer", kopenapi.BearerAuth("JWT"))
spec.AddSecurityScheme("apiKey", kopenapi.APIKeyAuth("X-Api-Key", kopenapi.InHeader))
spec.SetGlobalSecurity(kopenapi.Require("bearer"))

api := kori.Group(r, "/api")

// Público limpa o requisito global de bearer
kori.GET(api, "/projects", listProjects(store),
    spec.Route(kopenapi.RouteConfig{
        Summary:    "List projects",
        Tags:       []string{"projects"},
        Responses:  map[int]any{200: []*Project{}},
        NoSecurity: true,
    }),
)

// Herda o bearer global
kori.POST(api, "/projects", createProject(store),
    kori.Use(bearerAuth),
    spec.Route(kopenapi.RouteConfig{
        Summary:   "Create project",
        Tags:      []string{"projects"},
        Body:      CreateProjectBody{},
        Responses: map[int]any{201: Project{}, 422: kori.HTTPError{}},
    }),
)

// Sobrescreve o bearer global com a chave de API
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

A especificação gerada carrega os dois esquemas sob `components.securitySchemes`, um `security` de nível superior exigindo `bearer`, e `security` por operação para as rotas pública e de chave de API.
