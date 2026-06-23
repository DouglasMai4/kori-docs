---
title: Tratamento de Erros
---

# Tratamento de Erros

A diferença mais visível entre um handler Kori e um handler Chi puro é o tipo de retorno.

```go
// Chi puro
func handler(w http.ResponseWriter, r *http.Request) { ... }

// Kori
func handler(w http.ResponseWriter, r *http.Request) error { ... }
```

## Retornando erros

Retorne qualquer `error` de um handler. O Kori o intercepta e escreve a resposta.

```go
func getUser(w http.ResponseWriter, r *http.Request) error {
    user, err := db.Find(chi.URLParam(r, "id"))
    if err != nil {
        return kori.NotFound("user not found")
    }
    return kori.JSON(w, http.StatusOK, user)
}
```

As regras são:

| Valor retornado | Comportamento |
|---|---|
| `nil` | Nada — você já escreveu a resposta |
| `*kori.HTTPError` | Resposta JSON com o status code do erro |
| Qualquer outro `error` | `500 Internal Server Error` |

## Erros HTTP

O Kori fornece construtores para os status codes mais comuns:

```go
return kori.BadRequest("invalid input")           // 400
return kori.Unauthorized("missing token")         // 401
return kori.Forbidden("insufficient permissions") // 403
return kori.NotFound("user not found")            // 404
return kori.Conflict("email already in use")      // 409
return kori.UnprocessableEntity("invalid data")   // 422
return kori.InternalServerError("unexpected err") // 500
```

Todos aceitam um segundo argumento opcional para detalhes estruturados:

```go
return kori.NotFound("user not found", map[string]string{
    "id": chi.URLParam(r, "id"),
})

return kori.NewError(http.StatusTooManyRequests, "rate limit exceeded", map[string]int{
    "retry_after": 60,
})
```

## Respostas de erro automáticas

Quando um handler retorna um `*kori.HTTPError`, o handler de erro padrão escreve:

```json
{
  "message": "user not found"
}
```

Com detalhes:

```json
{
  "message": "rate limit exceeded",
  "details": { "retry_after": 60 }
}
```

Erros desconhecidos (qualquer coisa que não seja `*kori.HTTPError`) produzem:

```json
{
  "message": "internal server error"
}
```

## Handler de erro customizado

Substitua o handler padrão com `kori.SetErrorHandler`. Chame uma vez na inicialização, antes de qualquer requisição ser tratada.

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

Um caso de uso comum é o RFC 7807 Problem Details:

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

## Tipo HTTPError

```go
type HTTPError struct {
    Status  int    `json:"-"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}
```

Você pode construir um diretamente para status codes customizados:

```go
return kori.NewError(http.StatusPaymentRequired, "payment required")
return kori.NewError(http.StatusServiceUnavailable, "service unavailable", map[string]string{
    "reason": "database unreachable",
})
```
