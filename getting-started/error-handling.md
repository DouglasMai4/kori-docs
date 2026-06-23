---
title: Error Handling
---

# Error Handling

The most visible difference between a Kori handler and a plain Chi handler is the return type.

```go
// plain Chi
func handler(w http.ResponseWriter, r *http.Request) { ... }

// Kori
func handler(w http.ResponseWriter, r *http.Request) error { ... }
```

## Returning errors

Return any `error` from a handler. Kori intercepts it and writes the response.

```go
func getUser(w http.ResponseWriter, r *http.Request) error {
    user, err := db.Find(chi.URLParam(r, "id"))
    if err != nil {
        return kori.NotFound("user not found")
    }
    return kori.JSON(w, http.StatusOK, user)
}
```

The rules are:

| Returned value | Behavior |
|---|---|
| `nil` | Nothing — you already wrote the response |
| `*kori.HTTPError` | JSON response with the error's status code |
| Any other `error` | `500 Internal Server Error` |

## HTTP errors

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

All of them accept an optional second argument for structured details:

```go
return kori.NotFound("user not found", map[string]string{
    "id": chi.URLParam(r, "id"),
})

return kori.NewError(http.StatusTooManyRequests, "rate limit exceeded", map[string]int{
    "retry_after": 60,
})
```

## Automatic error responses

When a handler returns a `*kori.HTTPError`, the default error handler writes:

```json
{
  "message": "user not found"
}
```

With details:

```json
{
  "message": "rate limit exceeded",
  "details": { "retry_after": 60 }
}
```

Unknown errors (anything that is not `*kori.HTTPError`) produce:

```json
{
  "message": "internal server error"
}
```

## Custom error handler

Replace the default handler with `kori.SetErrorHandler`. Call it once at startup, before any requests are handled.

```go
kori.SetErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
    var he *kori.HTTPError
    if !errors.As(err, &he) {
        slog.Error("unhandled error", "err", err, "path", r.URL.Path)
        he = kori.InternalServerError("internal server error")
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(he.Status)
    json.NewEncoder(w).Encode(he)
})
```

A common use case is RFC 7807 Problem Details:

```go
kori.SetErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
    var he *kori.HTTPError
    if !errors.As(err, &he) {
        he = kori.InternalServerError("internal server error")
    }

    w.Header().Set("Content-Type", "application/problem+json")
    w.WriteHeader(he.Status)
    json.NewEncoder(w).Encode(map[string]any{
        "type":   "https://api.example.com/errors",
        "status": he.Status,
        "detail": he.Message,
    })
})
```

## HTTPError type

```go
type HTTPError struct {
    Status  int    `json:"-"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}
```

You can construct one directly for custom status codes:

```go
return kori.NewError(http.StatusPaymentRequired, "payment required")
return kori.NewError(http.StatusServiceUnavailable, "service unavailable", map[string]string{
    "reason": "database unreachable",
})
```
