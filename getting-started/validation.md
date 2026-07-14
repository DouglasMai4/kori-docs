---
title: Validation
---

# Validation

Kori uses [go-playground/validator](https://github.com/go-playground/validator) for struct validation. It runs automatically inside every `Bind*` call — you don't call the validator directly.

## Validation tags

Add `validate` tags to any struct field:

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

Common tags:

| Tag | Meaning |
|---|---|
| `required` | Field must be present and non-zero |
| `omitempty` | Skip validation if the field is empty |
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

The full list is in the [validator documentation](https://pkg.go.dev/github.com/go-playground/validator/v10).

## Binding and validation

Every `Bind*` call runs validation after decoding. No separate step is needed:

```go
type CreateTodoBody struct {
    Title    string `json:"title"    validate:"required,min=1,max=200"`
    Priority string `json:"priority" validate:"required,oneof=low medium high"`
}

func createTodo(w http.ResponseWriter, r *http.Request) error {
    var body CreateTodoBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // handles both decoding and validation errors
    }
    // body is valid here
    return kori.JSON(w, http.StatusCreated, todo)
}
```

The same applies to all binding functions: `BindQuery`, `BindPath`, `BindHeader`, `BindForm`, `BindMultipart`.

## Validation errors and 422 responses

When validation fails, Kori returns an `*HTTPError` with status `422 Unprocessable Entity` and a `details` array describing each failing field:

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

Each detail entry is a `kori.ValidationDetail`:

```go
type ValidationDetail struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Param   string `json:"param,omitempty"`
    Message string `json:"message"`
}
```

## Optional fields

Use a pointer or `omitempty` to make a field optional:

```go
type UpdateTodoBody struct {
    Title     string `json:"title"     validate:"omitempty,min=1,max=200"`
    Completed *bool  `json:"completed"` // pointer: present = explicitly set
}
```

- `omitempty` skips the validation rules when the field is zero-value
- A pointer field allows the caller to distinguish between "not provided" and `false`

## Field names in errors

Kori's validator uses the field's `json`, `query`, `path`, `header`, or `form` tag as the field name in error messages — not the Go struct field name. This means clients always see the name they sent.

```go
type Query struct {
    Page int `query:"page" validate:"min=1"`
}
// error message: "page must be at least 1" (not "Page")
```
