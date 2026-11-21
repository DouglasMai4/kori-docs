---
title: kori package
description: Every exported function, type and variable in github.com/douglasmai4/kori.
tableOfContents:
  maxHeadingLevel: 3
---

```go
import "github.com/douglasmai4/kori"
```

Requires Go 1.26+ and `github.com/go-chi/chi/v5`.

## Routing

### Method functions

```go
func GET(r chi.Router, pattern string, h Handler, opts ...Option)
func POST(r chi.Router, pattern string, h Handler, opts ...Option)
func PUT(r chi.Router, pattern string, h Handler, opts ...Option)
func PATCH(r chi.Router, pattern string, h Handler, opts ...Option)
func DELETE(r chi.Router, pattern string, h Handler, opts ...Option)
func HEAD(r chi.Router, pattern string, h Handler, opts ...Option)
func OPTIONS(r chi.Router, pattern string, h Handler, opts ...Option)
```

Register `h` on `r` for the given HTTP method. `r` can be any `chi.Router`, including a `*kori.Router` returned by `Group`. Errors returned by `h` are passed to the current [`ErrorHandler`](#errorhandler).

```go
kori.GET(r, "/users", listUsers)
kori.GET(r, "/users/{id}", getUser, kori.Use(adminOnly))
```

### Group

```go
func Group(r chi.Router, prefix string, middlewares ...Middleware) *Router
```

Creates a sub-router mounted at `prefix` with the given middlewares. Groups nest; the full prefix is tracked so options like OpenAPI see the complete path.

```go
users := kori.Group(r, "/users", authMiddleware)
kori.GET(users, "/", listUsers)
kori.GET(users, "/{id}", getUser)
```

### Router

```go
type Router struct {
    chi.Router
    // unexported prefix
}
```

Returned by `Group`. It embeds `chi.Router`, so every Chi method (`Use`, `With`, `Get`, `Mount`…) is available.

### Use

```go
func Use(middlewares ...Middleware) Option
```

Attaches middlewares to a single route, in order, without creating a sub-router.

```go
kori.GET(r, "/admin", adminHandler, kori.Use(authMiddleware, auditMiddleware))
```

## Handlers and options

### Handler

```go
type Handler func(w http.ResponseWriter, r *http.Request) error
```

A standard handler signature that returns an `error`. Return `nil` after writing a response, or return an error and let the error handler write it.

### Middleware

```go
type Middleware = func(http.Handler) http.Handler
```

An alias for the standard middleware shape. Any Chi or `net/http` middleware works unchanged.

### Option

```go
type Option func(*RouteInfo)
```

Configures a route at registration time. `Use` and `openapi.Spec.Route` are options; you can write your own to build route loggers or registries.

### RouteInfo

```go
type RouteInfo struct {
    Method  string
    Pattern string
    // unexported fields
}
```

The route being registered, as seen by an `Option`. `Pattern` includes the group prefix.

## Binding

All binders decode into `dst` — a pointer to a struct — and then validate it with [go-playground/validator](https://github.com/go-playground/validator) using `validate` tags. Decode errors return **400**; validation errors return **422** with `[]ValidationDetail` as details.

| Function | Source | Struct tag |
| --- | --- | --- |
| `BindJSON(r, dst)` | Request body (JSON) | `json` |
| `BindQuery(r, dst)` | URL query string | `query` |
| `BindPath(r, dst)` | Chi URL params | `path` |
| `BindHeader(r, dst)` | Request headers | `header` |
| `BindForm(r, dst)` | `application/x-www-form-urlencoded` | `form` |
| `BindMultipart(r, dst)` | `multipart/form-data` values and files | `form` |
| `Bind(r, dst)` | Path, then query, then headers | `path`, `query`, `header` |

### BindJSON

```go
func BindJSON(r *http.Request, dst any) error
```

Decodes the body as JSON. An empty body skips decoding and only validates. Bodies over the limit (4 MB by default) return **413** `request body too large`; malformed JSON returns **400** `invalid JSON body`.

### BindQuery

```go
func BindQuery(r *http.Request, dst any) error
```

Slice fields collect repeated keys: `?tag=a&tag=b` fills `[]string{"a", "b"}`.

### BindPath

```go
func BindPath(r *http.Request, dst any) error
```

Reads values with `chi.URLParam`. Requires the request to have been routed by Chi.

### BindHeader

```go
func BindHeader(r *http.Request, dst any) error
```

Reads values with `r.Header.Get`, so names are case-insensitive.

### BindForm

```go
func BindForm(r *http.Request, dst any) error
```

Parses and decodes `r.PostForm`. Returns **400** `cannot parse form body` when parsing fails.

### BindMultipart

```go
func BindMultipart(r *http.Request, dst any) error
```

Decodes values and files. File fields must be `*multipart.FileHeader` or `[]*multipart.FileHeader`. Returns **400** `cannot parse multipart form` when parsing fails.

### Bind

```go
func Bind(r *http.Request, dst any) error
```

Runs path, query and header decoding into the same struct, then validates once. It does **not** read the body.

### Limits

```go
func SetMaxBodyBytes(n int64)       // BindJSON body limit, default 4 MB
func SetMaxMultipartMemory(n int64) // in-memory multipart limit, default 32 MB
```

Global settings. Call them during startup.

### ValidationDetail

```go
type ValidationDetail struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Param   string `json:"param,omitempty"`
    Message string `json:"message"`
}
```

One failed rule. `Field` uses the struct tag name (`json`, `query`, `path`, `header` or `form`), not the Go field name, so it matches what the client sent.

## Responses

```go
func JSON(w http.ResponseWriter, status int, v any) error
func RawJSON(w http.ResponseWriter, status int, data []byte) error
func Text(w http.ResponseWriter, status int, s string) error
func NoContent(w http.ResponseWriter) error
func Redirect(w http.ResponseWriter, r *http.Request, status int, url string) error
```

| Function | Writes |
| --- | --- |
| `JSON` | `v` encoded as JSON with `Content-Type: application/json` |
| `RawJSON` | Pre-encoded JSON bytes, unchanged |
| `Text` | A `text/plain` body |
| `NoContent` | `204 No Content` with no body |
| `Redirect` | A redirect to `url`; `status` is `301`, `302`, `303`, `307` or `308` |

Each returns the write error, so `return kori.JSON(...)` is the idiomatic last line of a handler.

## Errors

### HTTPError

```go
type HTTPError struct {
    Status  int    `json:"-"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

func (e *HTTPError) Error() string
```

A structured error with a status code. Return it from a handler and the error handler writes `Status` with `{"message", "details"}` as the body.

### Constructors

```go
func NewError(status int, message string, details ...any) *HTTPError

func BadRequest(msg string, details ...any) *HTTPError          // 400
func Unauthorized(msg string, details ...any) *HTTPError        // 401
func Forbidden(msg string, details ...any) *HTTPError           // 403
func NotFound(msg string, details ...any) *HTTPError            // 404
func Conflict(msg string, details ...any) *HTTPError            // 409
func UnprocessableEntity(msg string, details ...any) *HTTPError // 422
func InternalServerError(msg string, details ...any) *HTTPError // 500
```

Only the first `details` value is used.

```go
return kori.Conflict("email already in use", map[string]string{"email": in.Email})
```

### ErrorHandler

```go
type ErrorHandler func(w http.ResponseWriter, r *http.Request, err error)

func SetErrorHandler(h ErrorHandler)
func GetErrorHandler() ErrorHandler
```

Receives every error a handler returns. The default writes `*HTTPError` values as JSON and turns any other error into `500 {"message":"internal server error"}`. `SetErrorHandler` is global and safe for concurrent use. See [Custom error responses](/guides/custom-errors).

## Server-Sent Events

### NewSSEWriter

```go
func NewSSEWriter(w http.ResponseWriter) (*SSEWriter, error)
```

Sets the SSE headers, flushes them, and returns a writer. Returns `ErrStreamingNotSupported` when `w` does not implement `http.Flusher`.

### SSEWriter methods

```go
func (s *SSEWriter) Send(event SSEEvent) error
func (s *SSEWriter) SendData(data string) error
func (s *SSEWriter) SendJSON(v any) error
func (s *SSEWriter) Ping() error
```

| Method | Sends |
| --- | --- |
| `Send` | A full event and flushes immediately |
| `SendData` | A data-only event, shorthand for `Send(SSEEvent{Data: data})` |
| `SendJSON` | `v` encoded as JSON in a data-only event |
| `Ping` | A comment line that keeps idle connections alive |

A write error usually means the client disconnected; treat it as the end of the stream.

### SSEEvent

```go
type SSEEvent struct {
    ID    string
    Event string
    Data  string
    Retry int
}
```

Empty fields are omitted. Multi-line `Data` is split into several `data:` lines.

### ErrStreamingNotSupported

```go
var ErrStreamingNotSupported = errors.New("kori: response writer does not support streaming (does not implement http.Flusher)")
```
