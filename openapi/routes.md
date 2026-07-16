---
title: Documenting Routes
---

# Documenting Routes

`spec.Route` takes a `RouteConfig` and returns a `kori.Option`. Everything you want in the operation its summary, parameters, request body, and responses is declared in that one struct, at the call site of the route it documents:

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

## RouteConfig fields

| Field | Type | Purpose |
| --- | --- | --- |
| `OperationID` | `string` | Unique operation identifier. Auto-generated from method + path if empty. |
| `Summary` | `string` | Short, one-line description of the operation. |
| `Description` | `string` | Longer explanation; supports the CommonMark the UI renders. |
| `Tags` | `[]string` | Groups the operation under one or more tags in the UI. |
| `Deprecated` | `bool` | Marks the operation as deprecated. |
| `Params` | `any` | A struct whose `path`/`query`/`header` tags become parameters. |
| `Body` | `any` | A struct describing the request body. Ignored for methods without a body. |
| `Responses` | `map[int]any` | Status code → response type. `nil` means no body. |
| `Security` | `[]SecurityRequirement` | Per-route auth, overriding the global default. See [Security](/openapi/security). |
| `NoSecurity` | `bool` | Marks the operation as public, clearing any global security. |

## Parameters

`Params` is a struct usually the same one you bind with `kori.BindQuery` or `kori.Bind` tagged with `path`, `query`, or `header`. Each tagged field becomes one parameter:

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

The tag name is the parameter name and its location (`in`). A field's Go type becomes the parameter schema, and its `validate`, `doc`, and `example` tags enrich it exactly as they do for [body schemas](/openapi/schemas).

Two rules on whether a parameter is `required`:

- **Path parameters are always required** the OpenAPI spec mandates it, so the `path` tag forces it regardless of validation tags.
- **Query and header parameters are required only when their `validate` tag contains `required`**; otherwise they are optional. A pointer field is never required.

Embedded (anonymous) structs are flattened, so you can share a common set of params by embedding:

```go
type Pagination struct {
    Page  int `query:"page"  validate:"min=0"`
    Limit int `query:"limit" validate:"min=0,max=100"`
}

type ListTodosParams struct {
    Pagination        // contributes page + limit
    Priority string `query:"priority"`
}
```

## Request body

`Body` is a struct converted to a JSON request-body schema under `application/json` and marked `required`:

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

The body is only meaningful for methods that carry one. For `GET`, `HEAD`, `DELETE`, `OPTIONS`, and `TRACE`, a `Body` is silently ignored, so you can reuse a config struct across methods without stray request bodies appearing on a `GET`.

See [Schema Generation](/openapi/schemas) for how the struct and its tags map to a JSON schema.

## Responses

`Responses` maps an HTTP status code to the type of that response's body. The value is turned into a schema under `application/json`; `nil` documents a response with no body:

```go
Responses: map[int]any{
    200: Todo{},          // 200 with a Todo body
    201: []Todo{},        // 201 with an array of Todo
    204: nil,             // 204 No Content, no body
    404: kori.HTTPError{}, // error shape from kori
},
```

Each response's `description` is filled in from the standard text for its status code (`200` → "OK", `404` → "Not Found"). Documenting your error responses with `kori.HTTPError{}` keeps the spec aligned with the shape Kori's [error handler](/getting-started/error-handling) actually returns.

If `Responses` is empty, the operation gets a single `default` response with no schema valid, but you'll almost always want to list the real status codes.

## Operation IDs

`OperationID` must be unique across the spec; tools use it to name generated client methods. Leave it empty and the module derives one from the method and path:

| Pattern | Method | Operation ID |
| --- | --- | --- |
| `/todos` | GET | `list-todos` |
| `/todos/{id}` | GET | `get-todo` |
| `/todos` | POST | `create-todo` |
| `/todos/{id}` | PUT | `replace-todo` |
| `/todos/{id}` | PATCH | `update-todo` |
| `/todos/{id}` | DELETE | `delete-todo` |
| `/todos` | HEAD | `head-todos` |
| `/todos` | OPTIONS | `options-todos` |

The verb comes from the method (and from whether the path ends in a parameter a `GET` on a collection is `list`, a `GET` on an item is `get`). Version segments like `v1` or `v2` are dropped, and when the verb refers to a single item the last path noun is singularized (`todos` → `todo`).

The generation covers the common REST shapes; set `OperationID` explicitly whenever you want a specific name or the heuristic doesn't fit your route.
