---
title: Testando handlers
description: Teste handlers Kori com net/http/httptest, pelo router ou isoladamente.
---

Handlers Kori são funções comuns sobre `http.ResponseWriter` e `*http.Request`, então a biblioteca padrão basta.

## Pelo router

Testar pelo Chi exercita roteamento, path params, middleware e error handler juntos. É o teste que pega mais bugs:

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

## Falhas de validação

Decodifique `details` em `[]kori.ValidationDetail` para verificar campos individuais:

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

## Chamando um handler diretamente

Como o handler retorna o erro, você pode verificar o próprio erro sem passar pelo HTTP:

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
Chamado diretamente, o handler não tem o route context do Chi, então `BindPath` e `chi.URLParam` veem valores vazios. Teste handlers que dependem do path pelo router, ou adicione o contexto com `chi.NewRouteContext()`.
:::

## Testando SSE

`httptest.ResponseRecorder` implementa `http.Flusher`, então `NewSSEWriter` funciona em testes. Leia `rec.Body.String()` depois que o handler retornar e verifique as linhas `data:`.
