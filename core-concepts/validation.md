---
title: Validation
---

# Validation

Kori integrates [`go-playground/validator`](https://github.com/go-playground/validator) and runs validation automatically as part of binding. There is no separate validation step.

## Validator integration

Kori initializes a shared `*validator.Validate` instance with `WithRequiredStructEnabled`, which makes the `required` tag apply to structs and non-pointer fields consistently.

The validator is shared across all binding calls and is initialized once. You do not need to configure or instantiate it yourself.

## Struct tags

Add `validate` tags to fields to declare constraints:

```go
type CreateUserInput struct {
    Name  string `json:"name"  validate:"required,min=2,max=100"`
    Email string `json:"email" validate:"required,email"`
    Age   int    `json:"age"   validate:"required,gte=0,lte=130"`
    Role  string `json:"role"  validate:"required,oneof=admin editor viewer"`
}
```

Any tag supported by `go-playground/validator` is accepted. Common tags:

| Tag | Meaning |
|---|---|
| `required` | Field must be present and non-zero |
| `omitempty` | Skip validation if the field is zero |
| `min=N` | Minimum length (string) or value (number) |
| `max=N` | Maximum length (string) or value (number) |
| `gte=N` | Greater than or equal to N |
| `lte=N` | Less than or equal to N |
| `gt=N` | Greater than N |
| `lt=N` | Less than N |
| `email` | Must be a valid email address |
| `url` | Must be a valid URL |
| `uuid4` | Must be a valid UUID v4 |
| `uuid` | Must be a valid UUID (any version) |
| `oneof=a b c` | Must be one of the listed values |
| `len=N` | Must have exactly N characters |

The tags above produce a human-readable `message` in the error response. Any other validator tag still works, but its `message` falls back to the raw error from `go-playground/validator`.

## Automatic validation

Every binding function runs validation after decoding. No explicit call is required:

```go
func createUser(w http.ResponseWriter, r *http.Request) error {
    var input CreateUserInput
    if err := kori.BindJSON(r, &input); err != nil {
        return err // 400 on bad JSON, 422 on validation failure
    }
    // input is valid here
    return kori.JSON(w, http.StatusCreated, input)
}
```

The binding functions that validate are:

| Function | Decodes |
|---|---|
| `kori.BindJSON(r, dst)` | Request body (JSON) |
| `kori.BindQuery(r, dst)` | URL query parameters |
| `kori.BindPath(r, dst)` | Chi URL path parameters |
| `kori.BindHeader(r, dst)` | HTTP headers |
| `kori.BindForm(r, dst)` | Form values (`application/x-www-form-urlencoded`) |
| `kori.BindMultipart(r, dst)` | Multipart form data |
| `kori.Bind(r, dst)` | Path + query + headers combined |

## Validation errors

When validation fails, Kori returns a `422 Unprocessable Entity` with a structured body:

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

Each entry corresponds to a `ValidationDetail`:

```go
type ValidationDetail struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Param   string `json:"param,omitempty"`
    Message string `json:"message"`
}
```

## Field names in errors

Kori registers a tag name function on the validator. When reporting errors, field names are resolved from the binding tag of the struct — not the Go field name:

```go
type Query struct {
    PageSize int `query:"page_size" validate:"min=1,max=100"`
}
```

A validation failure on `PageSize` reports `"field": "page_size"`, not `"field": "PageSize"`. The resolver checks tags in this order: `json`, `query`, `path`, `header`, `form`.

## Validation during binding

Binding and validation share the same struct. Tags for decoding (`json`, `query`, `path`, `header`, `form`) and tags for validation (`validate`) live on the same field:

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
    // q is decoded and validated
    return kori.JSON(w, http.StatusOK, results)
}
```

Path parameters work the same way:

```go
type PathID struct {
    ID int `path:"id" validate:"required,min=1"`
}

func getTodo(w http.ResponseWriter, r *http.Request) error {
    var p PathID
    if err := kori.BindPath(r, &p); err != nil {
        return err
    }
    // p.ID is an int, decoded from the URL and validated
    return kori.JSON(w, http.StatusOK, todo)
}
```
