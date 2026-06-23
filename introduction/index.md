---
title: What is Kori?
---

# What is Kori?

Kori is a toolkit for [Chi](https://github.com/go-chi/chi) that reduces the boilerplate common in Go HTTP services — without replacing anything you already rely on.

`net/http`, Chi, and standard middleware all continue to work exactly as before. Kori builds on top of them.

## What problems does it solve?

Writing HTTP handlers in Go with Chi is straightforward, but the same patterns repeat across every project:

- Decode the request body, handle the decode error
- Validate the struct, format and return validation errors
- Write the response with the right `Content-Type` and status code
- Return the right HTTP error from every edge case

None of this is hard, but it adds noise to every handler. Kori removes that noise while keeping the structure familiar.

## What Kori adds

| Feature                      | Description                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Error-returning handlers** | `Handler` is `func(w, r) error`. Return an error; Kori handles the response.                                                        |
| **Binding helpers**          | `BindJSON`, `BindQuery`, `BindPath`, `BindHeader`, `BindForm`, `BindMultipart`                                                      |
| **Automatic validation**     | Powered by [go-playground/validator](https://github.com/go-playground/validator). Invalid input returns structured `422` responses. |
| **Response helpers**         | `JSON`, `Text`, `NoContent`, `Redirect`, `RawJSON`                                                                                  |
| **Typed HTTP errors**        | `NotFound`, `BadRequest`, `Conflict`, `Unauthorized`, and more                                                                      |
| **Groups**                   | `kori.Group` for prefixed sub-routers with group-level middleware                                                                   |
| **Per-route middleware**     | `kori.Use(...)` attaches middleware to a single route without a sub-router                                                          |
| **SSE**                      | `SSEWriter` for Server-Sent Events                                                                                                  |
| **OpenAPI**                  | Optional `kori/openapi` module generates OpenAPI 3.1 specs from your routes                                                         |

## What Kori does not replace

Kori is not a framework. It does not replace:

- **`net/http`** — `http.ResponseWriter` and `*http.Request` remain the function signature
- **Chi** — routing, middleware, URL params, and sub-routers are still Chi
- **Standard middleware** — any `func(http.Handler) http.Handler` works unchanged

The same router can serve standard Chi handlers and Kori handlers side by side:

```go
r := chi.NewRouter()
r.Use(chimiddleware.Logger) // standard Chi middleware

// standard Chi handler — untouched
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// Kori handler on the same router
kori.GET(r, "/users", listUsers)
kori.POST(r, "/users", createUser)
```

## Example

A small but complete API using Kori's core features:

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/douglasmai4/kori"
)

type CreateUserBody struct {
    Name  string `json:"name"  validate:"required,min=2"`
    Email string `json:"email" validate:"required,email"`
}

type UserParams struct {
    ID string `path:"id" validate:"required,uuid4"`
}

func main() {
    r := chi.NewRouter()

    kori.GET(r, "/users/{id}", getUser)
    kori.POST(r, "/users", createUser)

    http.ListenAndServe(":8080", r)
}

func getUser(w http.ResponseWriter, r *http.Request) error {
    var p UserParams
    if err := kori.BindPath(r, &p); err != nil {
        return err // 422 with field details
    }

    user, err := db.Find(p.ID)
    if err != nil {
        return kori.NotFound("user not found")
    }

    return kori.JSON(w, http.StatusOK, user)
}

func createUser(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 for invalid JSON, 422 for validation errors
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }

    return kori.JSON(w, http.StatusCreated, user)
}
```

The handler signature is `func(w http.ResponseWriter, r *http.Request) error` — one extra return value, nothing else changed.
