---
title: Why Kori?
---

# Why Kori?

## Working with Chi is great

Chi is one of the best HTTP routers in the Go ecosystem. It is fast, composable, and fully compatible with `net/http`. It does not try to own your application — it gives you routing and middleware and stays out of the way.

If you already use Chi, Kori does not ask you to change how you think about your application. It only adds the parts Chi intentionally leaves to you.

## The repetitive parts

Most Chi handlers follow the same pattern. Here is a typical handler without Kori:

```go
func createUser(w http.ResponseWriter, r *http.Request) {
    var body CreateUserBody
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"message": "invalid JSON"})
        return
    }

    if err := validate.Struct(body); err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusUnprocessableEntity)
        json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
        return
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusConflict)
        json.NewEncoder(w).Encode(map[string]string{"message": "email already in use"})
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}
```

This pattern repeats in every handler that reads a body, validates input, or returns an error. The logic is correct — but most of it is infrastructure, not business logic.

## Less boilerplate, same architecture

The same handler with Kori:

```go
func createUser(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 or 422, with structured details
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }

    return kori.JSON(w, http.StatusCreated, user)
}
```

The architecture is identical. The handler still reads from `*http.Request`, still writes to `http.ResponseWriter`, and still runs inside a Chi router. The difference is that `BindJSON` handles decoding and validation in one call, `kori.Conflict` constructs the right error, and returning that error is enough — Kori writes the response.

The same applies to query parameters:

```go
// Without Kori
func listUsers(w http.ResponseWriter, r *http.Request) {
    pageStr := r.URL.Query().Get("page")
    page, err := strconv.Atoi(pageStr)
    if err != nil || page < 1 {
        http.Error(w, "invalid page", http.StatusBadRequest)
        return
    }
    limitStr := r.URL.Query().Get("limit")
    limit, err := strconv.Atoi(limitStr)
    if err != nil || limit < 1 || limit > 100 {
        http.Error(w, "invalid limit", http.StatusBadRequest)
        return
    }
    // ...
}

// With Kori
func listUsers(w http.ResponseWriter, r *http.Request) error {
    var p struct {
        Page  int `query:"page"  validate:"min=1"`
        Limit int `query:"limit" validate:"min=1,max=100"`
    }
    if err := kori.BindQuery(r, &p); err != nil {
        return err
    }
    // ...
}
```

## Inspired by Hono

[Hono](https://hono.dev) is a web framework for JavaScript runtimes. Its developer experience — concise handlers, typed request binding, composable routes — influenced how Kori approaches the same problems in Go.

Kori is not a port of Hono. Go and JavaScript are different languages with different idioms, and a direct translation would produce awkward Go. Instead, Kori takes the _idea_: that the parts between routing and business logic should be small, obvious, and consistent — and expresses it using Go's type system, standard library, and existing ecosystem.

The result is a toolkit that should feel familiar to any Go developer, while being noticeably less repetitive to write.
