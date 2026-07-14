---
title: Validação
---

# Validação

O Kori usa o [go-playground/validator](https://github.com/go-playground/validator) para validação de structs. Ele roda automaticamente dentro de toda chamada `Bind*` — você não chama o validator diretamente.

## Tags de validação

Adicione tags `validate` a qualquer campo da struct:

```go
type CreateUserBody struct {
    Name     string `json:"name"     validate:"required,min=2,max=100"`
    Email    string `json:"email"    validate:"required,email"`
    Age      int    `json:"age"      validate:"omitempty,gte=0,lte=120"`
    Role     string `json:"role"     validate:"required,oneof=admin editor viewer"`
    Password string `json:"password" validate:"required,min=8"`
    Website  string `json:"website"  validate:"omitempty,url"`
}
```

Tags comuns:

| Tag | Significado |
|---|---|
| `required` | O campo deve estar presente e não ser zero |
| `omitempty` | Pula a validação se o campo estiver vazio |
| `min=N` | Comprimento mínimo (string) ou valor mínimo (número) |
| `max=N` | Comprimento máximo (string) ou valor máximo (número) |
| `gte=N` | Maior ou igual a N |
| `lte=N` | Menor ou igual a N |
| `gt=N` | Maior que N |
| `lt=N` | Menor que N |
| `email` | Deve ser um endereço de e-mail válido |
| `url` | Deve ser uma URL válida |
| `uuid4` | Deve ser um UUID v4 válido |
| `uuid` | Deve ser um UUID válido (qualquer versão) |
| `oneof=a b c` | Deve ser um dos valores listados |
| `len=N` | Deve ter exatamente N caracteres |

A lista completa está na [documentação do validator](https://pkg.go.dev/github.com/go-playground/validator/v10).

## Binding e validação

Toda chamada `Bind*` executa a validação após a decodificação. Nenhuma etapa separada é necessária:

```go
type CreateTodoBody struct {
    Title    string `json:"title"    validate:"required,min=1,max=200"`
    Priority string `json:"priority" validate:"required,oneof=low medium high"`
}

func createTodo(w http.ResponseWriter, r *http.Request) error {
    var body CreateTodoBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // trata tanto erros de decodificação quanto de validação
    }
    // body é válido aqui
    return kori.JSON(w, http.StatusCreated, todo)
}
```

O mesmo se aplica a todas as funções de binding: `BindQuery`, `BindPath`, `BindHeader`, `BindForm`, `BindMultipart`.

## Erros de validação e respostas 422

Quando a validação falha, o Kori retorna um `*HTTPError` com status `422 Unprocessable Entity` e um array `details` descrevendo cada campo com falha:

```json
{
  "message": "validation failed",
  "details": [
    {
      "field": "email",
      "tag": "email",
      "message": "email must be a valid email address"
    },
    {
      "field": "name",
      "tag": "min",
      "param": "2",
      "message": "name must be at least 2"
    }
  ]
}
```

Cada entrada de detalhe é um `kori.ValidationDetail`:

```go
type ValidationDetail struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Param   string `json:"param,omitempty"`
    Message string `json:"message"`
}
```

## Campos opcionais

Use um ponteiro ou `omitempty` para tornar um campo opcional:

```go
type UpdateTodoBody struct {
    Title     string `json:"title"     validate:"omitempty,min=1,max=200"`
    Completed *bool  `json:"completed"` // ponteiro: presente = definido explicitamente
}
```

- `omitempty` pula as regras de validação quando o campo é zero-value
- Um campo ponteiro permite ao caller distinguir entre "não fornecido" e `false`

## Nomes de campo nos erros

O validator do Kori usa a tag `json`, `query`, `path`, `header` ou `form` do campo como nome nos erros — não o nome do campo Go. Isso garante que os clientes sempre vejam o nome que enviaram.

```go
type Query struct {
    Page int `query:"page" validate:"min=1"`
}
// mensagem de erro: "page must be at least 1" (não "Page")
```
