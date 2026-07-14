---
title: Validação
---

# Validação

O Kori integra o [`go-playground/validator`](https://github.com/go-playground/validator) e executa a validação automaticamente como parte do binding. Não há uma etapa de validação separada.

## Integração com o validador

O Kori inicializa uma instância compartilhada de `*validator.Validate` com `WithRequiredStructEnabled`, o que faz a tag `required` se aplicar a structs e campos não-ponteiro de forma consistente.

O validador é compartilhado por todas as chamadas de binding e inicializado uma única vez. Não é necessário configurá-lo ou instanciá-lo manualmente.

## Struct tags

Adicione tags `validate` aos campos para declarar restrições:

```go
type CreateUserInput struct {
    Name  string `json:"name"  validate:"required,min=2,max=100"`
    Email string `json:"email" validate:"required,email"`
    Age   int    `json:"age"   validate:"required,gte=0,lte=130"`
    Role  string `json:"role"  validate:"required,oneof=admin editor viewer"`
}
```

Qualquer tag suportada pelo `go-playground/validator` é aceita. Tags comuns:

| Tag | Significado |
|---|---|
| `required` | Campo deve estar presente e não-zero |
| `omitempty` | Pula a validação se o campo for zero |
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

As tags acima produzem uma `message` legível na resposta de erro. Qualquer outra tag do validator continua funcionando, mas sua `message` cai no erro cru do `go-playground/validator`.

## Validação automática

Toda função de binding executa a validação após a decodificação. Nenhuma chamada explícita é necessária:

```go
func createUser(w http.ResponseWriter, r *http.Request) error {
    var input CreateUserInput
    if err := kori.BindJSON(r, &input); err != nil {
        return err // 400 em JSON inválido, 422 em falha de validação
    }
    // input é válido aqui
    return kori.JSON(w, http.StatusCreated, input)
}
```

As funções de binding que validam são:

| Função | Decodifica |
|---|---|
| `kori.BindJSON(r, dst)` | Corpo da requisição (JSON) |
| `kori.BindQuery(r, dst)` | Parâmetros de query da URL |
| `kori.BindPath(r, dst)` | Parâmetros de caminho do Chi |
| `kori.BindHeader(r, dst)` | Headers HTTP |
| `kori.BindForm(r, dst)` | Valores de formulário (`application/x-www-form-urlencoded`) |
| `kori.BindMultipart(r, dst)` | Dados de formulário multipart |
| `kori.Bind(r, dst)` | Path + query + headers combinados |

## Erros de validação

Quando a validação falha, o Kori retorna `422 Unprocessable Entity` com um corpo estruturado:

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

Cada entrada corresponde a um `ValidationDetail`:

```go
type ValidationDetail struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Param   string `json:"param,omitempty"`
    Message string `json:"message"`
}
```

## Nomes de campos nos erros

O Kori registra uma função de resolução de nomes de tag no validador. Ao reportar erros, os nomes dos campos são resolvidos a partir da tag de binding da struct — não do nome do campo Go:

```go
type Query struct {
    PageSize int `query:"page_size" validate:"min=1,max=100"`
}
```

Uma falha de validação em `PageSize` reporta `"field": "page_size"`, não `"field": "PageSize"`. O resolvedor verifica as tags nesta ordem: `json`, `query`, `path`, `header`, `form`.

## Validação durante o binding

Binding e validação compartilham a mesma struct. As tags de decodificação (`json`, `query`, `path`, `header`, `form`) e as tags de validação (`validate`) ficam no mesmo campo:

```go
type ListTodosParams struct {
    Completed *bool  `query:"completed"`
    Search    string `query:"search"    validate:"omitempty,max=100"`
    Page      int    `query:"page"      validate:"omitempty,min=1"`
    PageSize  int    `query:"page_size" validate:"omitempty,min=1,max=100"`
}

func listTodos(w http.ResponseWriter, r *http.Request) error {
    var q ListTodosParams
    if err := kori.BindQuery(r, &q); err != nil {
        return err
    }
    // q está decodificado e validado
    return kori.JSON(w, http.StatusOK, results)
}
```

Parâmetros de caminho funcionam da mesma forma:

```go
type PathID struct {
    ID int `path:"id" validate:"required,min=1"`
}

func getTodo(w http.ResponseWriter, r *http.Request) error {
    var p PathID
    if err := kori.BindPath(r, &p); err != nil {
        return err
    }
    // p.ID é um int, decodificado da URL e validado
    return kori.JSON(w, http.StatusOK, todo)
}
```
