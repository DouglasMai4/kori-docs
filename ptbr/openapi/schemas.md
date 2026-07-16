---
title: Geração de Schemas
---

# Geração de Schemas

Toda struct que você passa para `Body`, `Responses` ou `Params` é convertida em um schema OpenAPI por reflexão. Structs nomeadas são registradas uma vez sob `#/components/schemas/` e referenciadas por `$ref` onde quer que apareçam, então um `Todo` usado em três respostas é descrito uma única vez e compartilhado.

```go
type Todo struct {
    ID        int       `json:"id"         doc:"Unique identifier"  example:"1"`
    Title     string    `json:"title"      doc:"Title of the task"  example:"Buy milk"`
    Done      bool      `json:"done"       doc:"Whether completed"  example:"false"`
    Priority  string    `json:"priority"   validate:"oneof=low medium high"`
    CreatedAt time.Time `json:"created_at"`
}
```

## Tags de struct

As mesmas tags que você escreve para binding e validação orientam o schema você não anota os tipos duas vezes:

| Tag | Efeito |
| --- | --- |
| `json` | Nome da propriedade no schema. `json:"-"` omite o campo. |
| `validate` | Enriquece o schema com restrições e `format` (veja abaixo). |
| `doc` | Define a `description` da propriedade. |
| `example` | Define o `example` da propriedade, convertido para número ou bool quando o tipo do campo é numérico ou booleano. |

## Validação → schema

A reflexão lê cada regra `validate` e traduz as que têm equivalente no JSON schema. Regras de comprimento e faixa se aplicam de forma diferente a strings e números:

| tag validate | Saída no schema |
| --- | --- |
| `required` | Campo adicionado ao array `required` do schema |
| `min=3` (string) | `minLength: 3` |
| `max=100` (string) | `maxLength: 100` |
| `min=1` (numérico) | `minimum: 1` |
| `max=100` (numérico) | `maximum: 100` |
| `gt=0` (numérico) | `exclusiveMinimum: 0` |
| `lt=100` (numérico) | `exclusiveMaximum: 100` |
| `len=10` (string) | `minLength: 10, maxLength: 10` |
| `email` | `format: email` |
| `uuid`, `uuid3`, `uuid4`, `uuid5` | `format: uuid` |
| `url`, `uri`, `http_url` | `format: uri` |
| `datetime` | `format: date-time` |
| `oneof=a b c` | `enum: ["a", "b", "c"]` |

Regras que o gerador não reconhece são ignoradas, então suas tags de validação podem carregar qualquer regra que o Kori valide apenas as relevantes para o schema aparecem na especificação.

## Obrigatório e nullable

Um campo é `required` quando sua tag `validate` contém `required` **e** não é um ponteiro. Campos ponteiro são o oposto: são tratados como nullable seu tipo vira `["type", "null"]` no OpenAPI 3.1 e são sempre excluídos de `required`. Isso espelha como o Kori vincula campos opcionais, onde um `*string` distingue "ausente" de "vazio":

```go
type UpdateTodoBody struct {
    Title    *string `json:"title"    validate:"omitempty,min=1,max=200"` // nullable, opcional
    Done     *bool   `json:"done"`                                        // nullable, opcional
    Priority string  `json:"priority" validate:"required,oneof=low medium high"` // obrigatório
}
```

## Tipos

Tipos Go mapeiam para schemas como você esperaria: inteiros viram `integer` (com formatos `int32`/`int64`), floats viram `number`, `bool` vira `boolean`, slices viram `array` com um schema `items`, e maps viram um `object` com `additionalProperties`. Structs aninhadas são registradas e referenciadas como qualquer outro schema nomeado.

Alguns tipos padrão têm um formato de transmissão que não corresponde à sua representação Go, então o gerador emite um schema fixo para eles em vez de refletir seus campos:

| Tipo Go | Schema |
| --- | --- |
| `time.Time` | `string`, `format: date-time` |
| `net/url.URL` | `string`, `format: uri` |
| `net.IP` | `string`, `format: ipv4` |
| `encoding/json.RawMessage` | sem tipo (qualquer JSON) |
| `github.com/google/uuid.UUID` | `string`, `format: uuid` |

## Structs embutidas e genéricos

Structs embutidas (anônimas) são inlinadas seus campos e entradas `required` são mescladas no schema externo em vez de referenciadas separadamente:

```go
type Meta struct {
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Todo struct {
    Meta         // created_at + updated_at aparecem diretamente em Todo
    ID   int    `json:"id"`
    Title string `json:"title"`
}
```

Instanciações de genéricos recebem um nome de componente válido substituindo os colchetes do parâmetro de tipo: `SuccessResponse[HomeResponse]` é registrado como `SuccessResponse_HomeResponse`. Isso permite documentar tipos de envelope genéricos um wrapper compartilhado `SuccessResponse[T]`, por exemplo sem nenhuma nomeação manual.

Tipos recursivos e auto-referenciais são tratados com segurança: um tipo que se refere a si mesmo resolve para um `$ref` em vez de recorrer infinitamente.
