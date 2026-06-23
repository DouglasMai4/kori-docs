---
title: Project Structure
---

# Project Structure

Kori does not enforce any project structure. It works with any layout — a single `main.go`, a flat package, or a layered architecture.

This page shows one structure that works well for small to medium APIs.

## Recommended layout

```text
my-api/
├── cmd/
│   └── api/
│       └── main.go          # entry point: router setup, server start
├── internal/
│   ├── handler/
│   │   ├── user.go          # HTTP handlers for /users
│   │   └── post.go          # HTTP handlers for /posts
│   ├── service/
│   │   ├── user.go          # business logic
│   │   └── post.go
│   └── repository/
│       ├── user.go          # data access
│       └── post.go
├── go.mod
└── go.sum
```

## What goes where

**`cmd/api/main.go`** — creates the router, registers all routes, starts the HTTP server. Nothing else.

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/douglasmai4/kori"

    "my-api/internal/handler"
    "my-api/internal/repository"
    "my-api/internal/service"
)

func main() {
    userRepo := repository.NewUserRepository()
    userSvc  := service.NewUserService(userRepo)
    userH    := handler.NewUserHandler(userSvc)

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    api := kori.Group(r, "/api/v1")
    kori.GET(api, "/users",      userH.List)
    kori.POST(api, "/users",     userH.Create)
    kori.GET(api, "/users/{id}", userH.Get)
    kori.DELETE(api, "/users/{id}", userH.Delete)

    http.ListenAndServe(":8080", r)
}
```

**`internal/handler/user.go`** — handlers receive their dependencies via a struct. No global state.

```go
package handler

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/douglasmai4/kori"

    "my-api/internal/service"
)

type UserHandler struct {
    svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
    return &UserHandler{svc: svc}
}

type CreateUserBody struct {
    Name  string `json:"name"  validate:"required,min=2"`
    Email string `json:"email" validate:"required,email"`
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) error {
    users, err := h.svc.List(r.Context())
    if err != nil {
        return kori.InternalServerError("failed to list users")
    }
    return kori.JSON(w, http.StatusOK, users)
}

func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    user, err := h.svc.Get(r.Context(), id)
    if err != nil {
        return kori.NotFound("user not found")
    }
    return kori.JSON(w, http.StatusOK, user)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err
    }
    user, err := h.svc.Create(r.Context(), body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }
    return kori.JSON(w, http.StatusCreated, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    if err := h.svc.Delete(r.Context(), id); err != nil {
        return kori.NotFound("user not found")
    }
    return kori.NoContent(w)
}
```

## Notes

**Kori works with any architecture.** The handler-service-repository split above is a common choice, not a requirement. Some projects put everything in `main.go`; others use domain-driven layouts. Kori adapts to what you already have.

**Dependencies via struct fields**, not global variables. Passing dependencies through constructors keeps handlers testable — swap the service for a mock and test the handler in isolation.

**Keep `main.go` focused on wiring.** Route registration, middleware setup, and server startup belong there. Business logic belongs in `internal`.
