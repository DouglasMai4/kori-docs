---
title: Testing handlers
description: Test Kori handlers with net/http/httptest — through the router or in isolation.
---

Kori handlers are plain functions over `http.ResponseWriter` and `*http.Request`, so the standard library is all you need.

## Through the router

Testing through Chi exercises routing, path params, middleware and the error handler together. This is the test that catches the most bugs:

```go
func newRouter() chi.Router {
    r := chi.NewRouter()
    kori.GET(r, "/users/{id}", getUser)
    kori.POST(r, "/users", createUser)
    return r
}

func TestGetUser_NotFound(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/users/missing", nil)
    rec := httptest.NewRecorder()

    newRouter().ServeHTTP(rec, req)

    if rec.Code != http.StatusNotFound {
        t.Fatalf("status = %d, want 404", rec.Code)
    }

    var body kori.HTTPError
    json.NewDecoder(rec.Body).Decode(&body)
    if body.Message != "user not found" {
        t.Errorf("message = %q", body.Message)
    }
}
```

## Validation failures

Decode `details` into `[]kori.ValidationDetail` to assert on individual fields:

```go
func TestCreateUser_InvalidEmail(t *testing.T) {
    req := httptest.NewRequest(http.MethodPost, "/users",
        strings.NewReader(`{"name":"Ana","email":"nope"}`))
    rec := httptest.NewRecorder()

    newRouter().ServeHTTP(rec, req)

    if rec.Code != http.StatusUnprocessableEntity {
        t.Fatalf("status = %d, want 422", rec.Code)
    }

    var body struct {
        Message string                  `json:"message"`
        Details []kori.ValidationDetail `json:"details"`
    }
    json.NewDecoder(rec.Body).Decode(&body)

    if len(body.Details) != 1 || body.Details[0].Field != "email" {
        t.Errorf("details = %+v", body.Details)
    }
}
```

## Calling a handler directly

Because a handler returns its error, you can assert on the error itself without going through HTTP:

```go
func TestGetUser_ReturnsHTTPError(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/users/missing", nil)
    rec := httptest.NewRecorder()

    err := getUser(rec, req)

    var he *kori.HTTPError
    if !errors.As(err, &he) || he.Status != http.StatusNotFound {
        t.Fatalf("err = %v, want 404 HTTPError", err)
    }
}
```

:::note
Called directly, a handler has no Chi route context, so `BindPath` and `chi.URLParam` see empty values. Test path-dependent handlers through the router, or add the context yourself with `chi.NewRouteContext()`.
:::

## Testing SSE

`httptest.ResponseRecorder` implements `http.Flusher`, so `NewSSEWriter` works in tests. Read `rec.Body.String()` after the handler returns and assert on the `data:` lines.
