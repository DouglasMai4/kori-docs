---
title: Options
---

# Options

Options são o mecanismo de extensão do Kori. Elas executam no momento do registro da rota e podem ler ou modificar os metadados da rota antes que o handler seja registrado no Chi.

## O que são Options?

Uma `Option` é uma função que recebe um `*RouteInfo`:

```go
type Option func(*RouteInfo)
```

`RouteInfo` contém os metadados resolvidos da rota sendo registrada:

```go
type RouteInfo struct {
    Method  string
    Pattern string
}
```

Toda chamada a `kori.GET`, `kori.POST` e similares aceita um `...Option` variádico como último argumento. Antes de registrar o handler, o Kori chama cada option em ordem:

```go
kori.GET(r, "/users", listUsers, optionA, optionB, optionC)
//                                 ↑ chamada com RouteInfo{Method: "GET", Pattern: "/users"}
```

## Por que Options existem

Options desacoplam o registro de rotas dos metadados da rota. O handler em si não sabe nada sobre OpenAPI, políticas de autorização ou requisitos de auditoria. Essas responsabilidades são expressas como options no ponto de chamada.

Esse design evita duas alternativas comuns:

- **Configuração baseada em structs** — exige instanciar um objeto de configuração por rota e torna a API verbosa.
- **Registros globais** — exige manter uma lista separada de rotas paralela à tabela de roteamento.

Com Options, a declaração de uma rota e todos os seus metadados associados ficam em um único lugar.

## A option nativa: `Use`

`kori.Use` é a única Option nativa. Ela anexa middlewares a uma rota específica:

```go
func Use(middlewares ...Middleware) Option {
    return func(ri *RouteInfo) {
        ri.middlewares = append(ri.middlewares, middlewares...)
    }
}
```

Uso:

```go
kori.GET(r, "/admin/stats", statsHandler, kori.Use(authMiddleware))
```

## Estendendo o Kori

Qualquer pacote pode definir sua própria `kori.Option` retornando `func(*kori.RouteInfo)`. A função recebe `Method` e `Pattern` e pode executar lógica arbitrária no momento do registro: popular registros externos, validar convenções de nomenclatura, gerar documentação.

Uma option personalizada que loga cada rota registrada:

```go
func LogRoute(logger *slog.Logger) kori.Option {
    return func(ri *kori.RouteInfo) {
        logger.Info("rota registrada", "method", ri.Method, "pattern", ri.Pattern)
    }
}

kori.GET(r, "/users", listUsers, LogRoute(logger))
```

Como `Option` é um tipo de função simples, as options se compõem sem suporte algum do framework:

```go
func Secure(mw ...kori.Middleware) kori.Option {
    return func(ri *kori.RouteInfo) {
        kori.Use(mw...)(ri)
        LogRoute(logger)(ri)
    }
}
```

## Além do núcleo

`Option` é a costura por onde o Kori se estende. Qualquer coisa que precise conhecer uma rota no momento do registro pode ser uma option, sem que o núcleo saiba dela.

O módulo [`openapi`](https://github.com/douglasmai4/kori/tree/main/openapi) é construído inteiramente assim. Ele expõe uma option `Route` que captura o método e o padrão de cada rota para construir uma especificação OpenAPI 3.1. Em essência:

```go
func (s *Spec) Route(cfg RouteConfig) kori.Option {
    return func(ri *kori.RouteInfo) {
        op := s.buildOperation(ri.Method, ri.Pattern, cfg)
        // armazena op na tabela interna de paths da spec
    }
}
```

`ri.Method` e `ri.Pattern` são os valores totalmente resolvidos que o Kori calculou antes de chamar a option — incluindo o prefixo acumulado do grupo — então uma option sempre enxerga o caminho completo e correto.

Geração de schemas, extração de parâmetros e requisitos de segurança vivem todos fora do núcleo do Kori, usando nada além da API pública de `Option`. Veja o [módulo `openapi`](https://github.com/douglasmai4/kori/tree/main/openapi) para sua própria API e uso.

## Options se compõem

Múltiplas options em uma única rota são independentes e todas executam, em ordem:

```go
kori.POST(r, "/users", createUser,
    kori.Use(authMiddleware),
    LogRoute(logger),
)
```

`kori.Use` anexa middleware à rota; `LogRoute` a registra em log. Nenhuma das duas options sabe da existência da outra.
