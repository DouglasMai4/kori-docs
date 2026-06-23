---
title: Filosofia
---

# Filosofia

O design do Kori é guiado por um conjunto pequeno de princípios. Entendê-los ajuda a explicar por que a API tem a forma que tem e quais tradeoffs foram feitos deliberadamente.

## Explícito ao invés de mágico

O `net/http` do Go é explícito por design. O Kori preserva isso.

Todo handler Kori tem a mesma assinatura:

```go
func(w http.ResponseWriter, r *http.Request) error
```

Não há injeção de contexto, nenhum tipo `Context` customizado, nenhum wrapper de requisição/resposta. O `w` e o `r` que você já conhece continuam sendo a única forma de ler a requisição e escrever a resposta.

Isso significa que qualquer desenvolvedor Go pode ler um handler Kori sem aprender novas abstrações, e qualquer ferramenta compatível com `net/http` — middlewares, test helpers, bibliotecas de tracing — continua funcionando sem alterações.

## Construído sobre padrões

O Kori não reinventa o que já existe. Ele conecta peças existentes e bem mantidas:

| Camada                               | Fornecida por                                                           |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Servidor HTTP e interface de handler | `net/http` (stdlib)                                                     |
| Roteamento e middleware              | [Chi](https://github.com/go-chi/chi)                                    |
| Validação de structs                 | [go-playground/validator](https://github.com/go-playground/validator)   |
| Geração de spec OpenAPI 3.1          | [`kori/openapi`](https://github.com/douglasmai4/kori/tree/main/openapi) |

Cada dependência foi escolhida por ser estável, idiomática e já amplamente usada no ecossistema Go. O trabalho do Kori é conectá-las de forma limpa, não substituí-las.

## Pequeno e focado

O Kori evita deliberadamente se tornar um framework full-stack.

Ele não é:

- um ORM ou camada de banco de dados
- um container de injeção de dependência
- um carregador de configuração
- um runtime HTTP customizado
- um framework monolítico que controla o ciclo de vida da aplicação

A superfície de API é intencionalmente pequena. Um toolkit menor é mais fácil de entender, mais fácil de atualizar e mais fácil de abandonar caso seus requisitos mudem.

## Composável

Cada feature do Kori pode ser adotada de forma independente. Não há etapa de inicialização obrigatória nem estado global que precise ser configurado antes de o restante funcionar.

Você pode usar:

- **Apenas binding** — `BindJSON`, `BindQuery`, `BindPath` em qualquer `*http.Request`
- **Apenas validação** — a validação roda automaticamente dentro de cada chamada `Bind*`
- **Apenas helpers de resposta** — `JSON`, `Text`, `NoContent` em qualquer `http.ResponseWriter`
- **Apenas helpers de erro** — `NotFound`, `BadRequest`, `Conflict` e o tipo `HTTPError` funcionam de forma independente
- **Apenas OpenAPI** — `kori/openapi` é um módulo separado; ele só adiciona o que você importar
- **Apenas SSE** — `NewSSEWriter` funciona com qualquer handler

Você não é obrigado a adotar uma estrutura de projeto específica nem a inicializar um objeto de aplicação central. As funções do Kori são funções simples — chame as que precisar.

## Extensível via Options

O ponto de extensão do Kori é o tipo `Option`:

```go
type Option func(*RouteInfo)
```

Uma `Option` recebe o método e o padrão da rota sendo registrada. É assim que o `kori/openapi` anexa metadados OpenAPI — como uma `Option` passada no momento do registro da rota — sem nenhuma etapa de registro separada.

Você pode escrever sua própria `Option` para logging de rotas, metadados de permissão ou qualquer outra preocupação transversal:

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

Options se compõem naturalmente — passe quantas precisar, em qualquer ordem.
