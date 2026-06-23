---
title: Sua Primeira API
---

# Sua Primeira API

Esta página constrói uma API CRUD pequena mas completa — uma lista de tarefas — passo a passo.

## Criar um router

O Chi fornece o router. O Kori registra handlers nele.

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

## Registrar rotas

Use `kori.GET`, `kori.POST`, etc. no lugar de `r.Get`, `r.Post`. A única diferença é que o handler retorna `error`.

```go
kori.GET(r, "/todos", listTodos)
kori.POST(r, "/todos", createTodo)
kori.GET(r, "/todos/{id}", getTodo)
kori.DELETE(r, "/todos/{id}", deleteTodo)
```

## Retornar JSON

`kori.JSON` define `Content-Type: application/json`, escreve o status e codifica o valor.

```go
func listTodos(w http.ResponseWriter, r *http.Request) error {
    todos := []string{"Comprar leite", "Passear com o cachorro"}
    return kori.JSON(w, http.StatusOK, todos)
}
```

## Tratar erros

Retorne um `HTTPError` de qualquer handler. O Kori escreve a resposta de erro JSON automaticamente.

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

## Exemplo completo

Uma API de tarefas executável com um store em memória:

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

## Executar e testar

```bash
go run .
```

```bash
# Criar
curl -X POST http://localhost:8080/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Comprar leite"}'

# Listar
curl http://localhost:8080/todos

# Buscar um
curl http://localhost:8080/todos/1

# Deletar
curl -X DELETE http://localhost:8080/todos/1
```
