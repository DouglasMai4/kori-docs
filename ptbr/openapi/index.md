---
title: OpenAPI
---

# OpenAPI

O `kori/openapi` gera uma especificação OpenAPI 3.1 a partir das mesmas structs Go que você já usa para binding e validação. Ele se conecta ao sistema de [Options](/ptbr/core-concepts/options) do Kori, então documentar uma rota acontece bem ao lado de registrá-la, sem etapa de CLI, sem arquivos YAML mantidos em sincronia à mão, sem schema duplicado entre código e documentação.

Como é construído inteiramente sobre a API pública de `Option`, o módulo vive em seu próprio pacote e o núcleo do Kori não sabe nada sobre ele. A adesão é opcional por rota: rotas sem uma option `spec.Route(...)` simplesmente ficam de fora da especificação.

## Instalação

```bash
go get github.com/douglasmai4/kori/openapi
```

Requer `github.com/douglasmai4/kori` e Go 1.26+.

## Início rápido

Crie um `Spec`, anexe uma option `spec.Route(...)` a cada rota que quiser documentar e sirva o resultado:

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

    // Sirva a especificação e uma UI interativa
    r.Get("/openapi.json", spec.JSONHandler())
    r.Get("/docs", spec.ScalarHandler("/openapi.json"))

    http.ListenAndServe(":8080", r)
}
```

`spec.Route` retorna uma `kori.Option`, então vai no mesmo slot variádico que `kori.Use`, como último argumento de qualquer `kori.GET`, `kori.POST`, e assim por diante. No momento do registro, ele lê o método e o padrão resolvidos da rota (incluindo qualquer prefixo de [grupo](/ptbr/core-concepts/groups)) e registra uma operação na especificação.

As três partes a seguir cobrem o resto do módulo:

- [Documentando Rotas](/ptbr/openapi/routes) - os campos do `RouteConfig` e como params, bodies e respostas se tornam operações.
- [Geração de Schemas](/ptbr/openapi/schemas) - como structs Go e suas tags viram JSON schemas.
- [Segurança](/ptbr/openapi/security) - declarando esquemas de autenticação e aplicando-os globalmente ou por rota.

## Config

`NewSpec` recebe os metadados do documento no nível superior:

```go
spec := kopenapi.NewSpec(kopenapi.Config{
    Title:       "Todo API",
    Version:     "1.0.0",
    Description: "Uma API de todos simples.",
    Servers: []kopenapi.Server{
        {URL: "https://api.example.com", Description: "Produção"},
        {URL: "http://localhost:8080", Description: "Local"},
    },
})
```

Apenas `Title` e `Version` são exigidos pela especificação OpenAPI; `Description` e `Servers` são opcionais.

## Servindo a especificação

O `Spec` constrói o documento de forma preguiçosa a cada requisição, então qualquer rota registrada, mesmo depois dos handlers estarem conectados, é refletida. Dois handlers o serializam:

```go
r.Get("/openapi.json", spec.JSONHandler())
r.Get("/openapi.yaml", spec.YAMLHandler())
```

Ambos são valores `http.HandlerFunc` comuns, então montam em qualquer `chi.Router` (ou mux do `net/http`) sem passar por `kori.GET` eles não fazem parte da sua API documentada.

## UI do Scalar

O [Scalar](https://scalar.com) é uma UI de referência de API, como o Swagger UI mas mais rápida e limpa. `ScalarHandler` serve uma página pronta que carrega sua especificação a partir da URL que você passa:

```go
r.Get("/docs", spec.ScalarHandler("/openapi.json"))
```

O argumento é a URL onde a especificação JSON é servida, não a especificação em si, o Scalar a busca a partir do navegador. Passe um `ScalarOptions` para personalizar a página:

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

| Opção | Efeito |
| --- | --- |
| `Theme` | Nome do tema do Scalar (ex.: `"purple"`, `"default"`) |
| `DarkMode` | Inicia no modo escuro |
| `HideModels` | Oculta a seção de modelos de schema |
| `HideDownloadButton` | Oculta o botão de download da especificação |
| `DefaultOpenAllTags` | Expande todos os grupos de tags por padrão |
| `CustomCSS` | CSS extra injetado na página |

## Convivência com o Chi puro

O módulo nunca assume o roteamento ele observa os registros através do ponto de extensão `Option`. Uma rota registrada sem `spec.Route(...)`, ou registrada diretamente com `r.Get`, é invisível para a especificação:

```go
r.Get("/health", healthHandler)                   // não documentada
kori.GET(r, "/todos", listTodos, spec.Route(cfg)) // documentada
```

Isso permite documentar a superfície pública da sua API deixando de fora health checks, endpoints internos e os próprios handlers da especificação.
