---
title: Your First API
---

# Your First API

This page builds a small but complete CRUD API — a to-do list — step by step.

## Create a router

Chi provides the router. Kori registers handlers on it.

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/douglasmai4/kori"
)

func main() {
    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    http.ListenAndServe(":8080", r)
}
```

## Register routes

Use `kori.GET`, `kori.POST`, etc. instead of `r.Get`, `r.Post`. The only difference is the handler returns `error`.

```go
kori.GET(r, "/todos", listTodos)
kori.POST(r, "/todos", createTodo)
kori.GET(r, "/todos/{id}", getTodo)
kori.DELETE(r, "/todos/{id}", deleteTodo)
```

## Return JSON

`kori.JSON` sets `Content-Type: application/json`, writes the status, and encodes the value.

```go
func listTodos(w http.ResponseWriter, r *http.Request) error {
    todos := []string{"Buy milk", "Walk the dog"}
    return kori.JSON(w, http.StatusOK, todos)
}
```

## Handle errors

Return an `HTTPError` from any handler. Kori writes the JSON error response automatically.

```go
func getTodo(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")
    todo, ok := store[id]
    if !ok {
        return kori.NotFound("todo not found")
    }
    return kori.JSON(w, http.StatusOK, todo)
}
```

## Complete example

A runnable to-do API with an in-memory store:

```go
package main

import (
    "fmt"
    "net/http"
    "sync"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/douglasmai4/kori"
)

type Todo struct {
    ID    string `json:"id"`
    Title string `json:"title"`
    Done  bool   `json:"done"`
}

type CreateTodoBody struct {
    Title string `json:"title" validate:"required,min=1,max=200"`
}

var (
    mu     sync.RWMutex
    todos  = map[string]*Todo{}
    nextID = 1
)

func main() {
    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    kori.GET(r, "/todos", listTodos)
    kori.POST(r, "/todos", createTodo)
    kori.GET(r, "/todos/{id}", getTodo)
    kori.DELETE(r, "/todos/{id}", deleteTodo)

    http.ListenAndServe(":8080", r)
}

func listTodos(w http.ResponseWriter, r *http.Request) error {
    mu.RLock()
    defer mu.RUnlock()

    list := make([]*Todo, 0, len(todos))
    for _, t := range todos {
        list = append(list, t)
    }
    return kori.JSON(w, http.StatusOK, list)
}

func createTodo(w http.ResponseWriter, r *http.Request) error {
    var body CreateTodoBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err
    }

    mu.Lock()
    defer mu.Unlock()

    id := fmt.Sprintf("%d", nextID)
    nextID++
    todo := &Todo{ID: id, Title: body.Title}
    todos[id] = todo

    return kori.JSON(w, http.StatusCreated, todo)
}

func getTodo(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")

    mu.RLock()
    defer mu.RUnlock()

    todo, ok := todos[id]
    if !ok {
        return kori.NotFound("todo not found")
    }
    return kori.JSON(w, http.StatusOK, todo)
}

func deleteTodo(w http.ResponseWriter, r *http.Request) error {
    id := chi.URLParam(r, "id")

    mu.Lock()
    defer mu.Unlock()

    if _, ok := todos[id]; !ok {
        return kori.NotFound("todo not found")
    }
    delete(todos, id)
    return kori.NoContent(w)
}
```

## Run and test

```bash
go run .
```

```bash
# Create
curl -X POST http://localhost:8080/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

# List
curl http://localhost:8080/todos

# Get one
curl http://localhost:8080/todos/1

# Delete
curl -X DELETE http://localhost:8080/todos/1
```
