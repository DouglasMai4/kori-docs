---
title: Documentando Rotas
---

# Documentando Rotas

`spec.Route` recebe um `RouteConfig` e retorna uma `kori.Option`. Tudo o que você quer na operação seu resumo, parâmetros, corpo da requisição e respostas é declarado nessa única struct, no ponto de chamada da rota que ela documenta:

```go
kori.POST(r, "/todos", createTodo,
    spec.Route(kopenapi.RouteConfig{
        OperationID: "createTodo",
        Summary:     "Create a todo",
        Description: "Adds a new todo item to the list.",
        Tags:        []string{"todos"},
        Body:        CreateTodoBody{},
        Responses: map[int]any{
            201: Todo{},
            422: kori.HTTPError{},
        },
    }),
)
```

## Campos do RouteConfig

| Campo | Tipo | Propósito |
| --- | --- | --- |
| `OperationID` | `string` | Identificador único da operação. Gerado a partir do método + caminho se vazio. |
| `Summary` | `string` | Descrição curta, de uma linha, da operação. |
| `Description` | `string` | Explicação mais longa; aceita o CommonMark que a UI renderiza. |
| `Tags` | `[]string` | Agrupa a operação sob uma ou mais tags na UI. |
| `Deprecated` | `bool` | Marca a operação como obsoleta. |
| `Params` | `any` | Uma struct cujas tags `path`/`query`/`header` viram parâmetros. |
| `Body` | `any` | Uma struct descrevendo o corpo da requisição. Ignorada em métodos sem corpo. |
| `Responses` | `map[int]any` | Código de status → tipo da resposta. `nil` significa sem corpo. |
| `Security` | `[]SecurityRequirement` | Autenticação por rota, sobrescrevendo o padrão global. Ver [Segurança](/ptbr/openapi/security). |
| `NoSecurity` | `bool` | Marca a operação como pública, limpando qualquer segurança global. |

## Parâmetros

`Params` é uma struct normalmente a mesma que você vincula com `kori.BindQuery` ou `kori.Bind` anotada com `path`, `query` ou `header`. Cada campo anotado vira um parâmetro:

```go
type ListTodosParams struct {
    Priority string `query:"priority" validate:"omitempty,oneof=low medium high" doc:"Filter by priority"`
    Page     int    `query:"page"     validate:"min=0" doc:"Page number (0-based)" example:"0"`
    Limit    int    `query:"limit"    validate:"min=0,max=100" doc:"Items per page" example:"20"`
}

type TodoIDParams struct {
    ID int `path:"id" validate:"required,min=1" doc:"Todo ID" example:"1"`
}
```

O nome da tag é o nome do parâmetro e sua localização (`in`). O tipo Go do campo vira o schema do parâmetro, e suas tags `validate`, `doc` e `example` o enriquecem exatamente como fazem nos [schemas de corpo](/ptbr/openapi/schemas).

Duas regras sobre quando um parâmetro é `required`:

- **Parâmetros de caminho são sempre obrigatórios** a especificação OpenAPI exige isso, então a tag `path` força o `required` independentemente das tags de validação.
- **Parâmetros de query e header são obrigatórios apenas quando sua tag `validate` contém `required`**; caso contrário são opcionais. Um campo ponteiro nunca é obrigatório.

Structs embutidas (anônimas) são achatadas, então você pode compartilhar um conjunto comum de params embutindo-o:

```go
type Pagination struct {
    Page  int `query:"page"  validate:"min=0"`
    Limit int `query:"limit" validate:"min=0,max=100"`
}

type ListTodosParams struct {
    Pagination        // contribui com page + limit
    Priority string `query:"priority"`
}
```

## Corpo da requisição

`Body` é uma struct convertida em um schema de corpo JSON sob `application/json` e marcada como `required`:

```go
type CreateTodoBody struct {
    Title    string `json:"title"    validate:"required,min=1,max=200"`
    Priority string `json:"priority" validate:"required,oneof=low medium high"`
}

kori.POST(r, "/todos", createTodo,
    spec.Route(kopenapi.RouteConfig{
        Body: CreateTodoBody{},
        // ...
    }),
)
```

O corpo só faz sentido para métodos que carregam um. Para `GET`, `HEAD`, `DELETE`, `OPTIONS` e `TRACE`, um `Body` é silenciosamente ignorado, então você pode reutilizar uma struct de config entre métodos sem que corpos de requisição perdidos apareçam em um `GET`.

Veja [Geração de Schemas](/ptbr/openapi/schemas) para saber como a struct e suas tags mapeiam para um JSON schema.

## Respostas

`Responses` mapeia um código de status HTTP para o tipo do corpo daquela resposta. O valor é transformado em um schema sob `application/json`; `nil` documenta uma resposta sem corpo:

```go
Responses: map[int]any{
    200: Todo{},          // 200 com um corpo Todo
    201: []Todo{},        // 201 com um array de Todo
    204: nil,             // 204 No Content, sem corpo
    404: kori.HTTPError{}, // formato de erro do kori
},
```

A `description` de cada resposta é preenchida a partir do texto padrão do seu código de status (`200` → "OK", `404` → "Not Found"). Documentar suas respostas de erro com `kori.HTTPError{}` mantém a especificação alinhada com o formato que o [tratador de erros](/ptbr/getting-started/error-handling) do Kori realmente retorna.

Se `Responses` estiver vazio, a operação recebe uma única resposta `default` sem schema válida, mas você quase sempre vai querer listar os códigos de status reais.

## IDs de operação

`OperationID` precisa ser único em toda a especificação; ferramentas o usam para nomear os métodos de cliente gerados. Deixe-o vazio e o módulo deriva um a partir do método e do caminho:

| Padrão | Método | ID de operação |
| --- | --- | --- |
| `/todos` | GET | `list-todos` |
| `/todos/{id}` | GET | `get-todo` |
| `/todos` | POST | `create-todo` |
| `/todos/{id}` | PUT | `replace-todo` |
| `/todos/{id}` | PATCH | `update-todo` |
| `/todos/{id}` | DELETE | `delete-todo` |
| `/todos` | HEAD | `head-todos` |
| `/todos` | OPTIONS | `options-todos` |

O verbo vem do método (e de se o caminho termina em um parâmetro um `GET` numa coleção é `list`, um `GET` num item é `get`). Segmentos de versão como `v1` ou `v2` são descartados, e quando o verbo se refere a um único item o último substantivo do caminho é colocado no singular (`todos` → `todo`).

A geração cobre os formatos REST comuns; defina `OperationID` explicitamente sempre que quiser um nome específico ou a heurística não se encaixar na sua rota.
