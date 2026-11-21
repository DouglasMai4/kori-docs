---
title: Custom error responses
description: Replace the default error format, log unexpected errors, and map domain errors to HTTP status codes.
---

Every error a Kori handler returns passes through one function: the error handler. Replace it once and the whole API changes shape.

## The default

Out of the box, `*HTTPError` values are written as JSON with their status, and any other error becomes a generic 500 so internals never leak:

```json
{ "message": "user not found" }
{ "message": "validation failed", "details": [{ "field": "email", "tag": "email", "message": "email must be a valid email address" }] }
{ "message": "internal server error" }
```

## Logging unexpected errors

The most common customization keeps the format and adds logging for anything that is not an `HTTPError`. Wrap the current handler instead of rewriting it:

```go
func main() {
    base := kori.GetErrorHandler()

    kori.SetErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
        var he *kori.HTTPError
        if !errors.As(err, &he) {
            slog.ErrorContext(r.Context(), "unhandled error",
                "method", r.Method,
                "path", r.URL.Path,
                "err", err,
            )
        }
        base(w, r, err)
    })
}
```

## Mapping domain errors

Keep your service layer free of HTTP and translate at the edge:

```go
// package store
var (
    ErrNotFound  = errors.New("not found")
    ErrDuplicate = errors.New("duplicate")
)
```

```go
base := kori.GetErrorHandler()

kori.SetErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
    switch {
    case errors.Is(err, store.ErrNotFound):
        err = kori.NotFound("resource not found")
    case errors.Is(err, store.ErrDuplicate):
        err = kori.Conflict("resource already exists")
    }
    base(w, r, err)
})
```

Handlers can now simply `return err` from the repository call.

## Problem Details (RFC 9457)

To speak `application/problem+json`, write the response yourself:

```go
kori.SetErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
    he := kori.InternalServerError("internal server error")
    errors.As(err, &he)

    w.Header().Set("Content-Type", "application/problem+json")
    w.WriteHeader(he.Status)
    json.NewEncoder(w).Encode(map[string]any{
        "type":     "about:blank",
        "title":    http.StatusText(he.Status),
        "status":   he.Status,
        "detail":   he.Message,
        "instance": r.URL.Path,
        "errors":   he.Details,
    })
})
```

:::caution
`SetErrorHandler` is global. Call it once during startup, before the server begins accepting requests.
:::
