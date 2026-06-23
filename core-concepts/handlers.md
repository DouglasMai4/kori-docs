---
title: Handlers
---

# Handlers

A handler in Kori is a function that processes an HTTP request and returns an error.

## Standard net/http handlers

The standard library defines a handler as a function that writes to a `ResponseWriter` and returns nothing:

```go
func listUsers(w http.ResponseWriter, r *http.Request) {
    users, err := db.All()
    if err != nil {
        http.Error(w, "internal server error", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(users)
}
```

Error handling is manual. Every path that fails requires writing a response and returning early. Forgetting either is a silent bug.

## Kori handlers

Kori defines its own handler type:

```go
type Handler func(w http.ResponseWriter, r *http.Request) error
```

The signature is identical to `http.HandlerFunc` except for the `error` return. Kori wraps the handler internally and catches any non-nil error before it reaches the client.

```go
func listUsers(w http.ResponseWriter, r *http.Request) error {
    users, err := db.All()
    if err != nil {
        return kori.InternalServerError("could not fetch users")
    }
    return kori.JSON(w, http.StatusOK, users)
}
```

Handlers are registered on any `chi.Router`:

```go
kori.GET(r, "/users", listUsers)
```

## Returning errors

When a handler returns an error, Kori passes it to the configured error handler. The default behavior is:

| Returned value | Response |
|---|---|
| `nil` | No action — you already wrote the response |
| `*kori.HTTPError` | JSON with the error's status code |
| Any other `error` | `500 Internal Server Error` |

Kori provides constructors for common status codes:

```go
return kori.BadRequest("invalid input")           // 400
return kori.Unauthorized("missing token")         // 401
return kori.Forbidden("insufficient permissions") // 403
return kori.NotFound("user not found")            // 404
return kori.Conflict("email already in use")      // 409
return kori.UnprocessableEntity("invalid data")   // 422
return kori.InternalServerError("unexpected err") // 500
```

For custom status codes, use `kori.NewError`:

```go
return kori.NewError(http.StatusTooManyRequests, "rate limit exceeded", map[string]int{
    "retry_after": 60,
})
```

The second argument is optional structured details, included in the JSON response under `"details"`.

## Response helpers

Kori provides helpers for writing responses. Each returns the write error so it can propagate up:

```go
kori.JSON(w, http.StatusOK, payload)          // application/json
kori.RawJSON(w, http.StatusOK, rawBytes)      // pre-encoded JSON bytes
kori.Text(w, http.StatusOK, "hello")          // text/plain
kori.NoContent(w)                             // 204
kori.Redirect(w, r, http.StatusFound, "/new") // redirect
```

## Benefits

**Explicit error flow.** Errors bubble up naturally. There is no way to accidentally swallow an error without explicitly ignoring the return value.

**Centralized handling.** One `SetErrorHandler` call configures how all errors are rendered. You can swap the entire error format — JSON, Problem Details, XML — in one place:

```go
kori.SetErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
    var he *kori.HTTPError
    if !errors.As(err, &he) {
        he = kori.InternalServerError("internal server error")
    }
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(he.Status)
    json.NewEncoder(w).Encode(he)
})
```

**Less boilerplate.** Route logic stays focused on the happy path. Early returns propagate errors up without writing responses inline.

**Compatible with net/http.** Standard Chi handlers and Kori handlers coexist on the same router. Migration is incremental.
