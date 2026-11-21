---
title: Respostas de erro customizadas
description: Substitua o formato de erro padrão, registre erros inesperados e mapeie erros de domínio para status HTTP.
---

Todo erro retornado por um handler Kori passa por uma função: o error handler. Substitua-o uma vez e a API inteira muda de formato.

## O padrão

Por padrão, valores `*HTTPError` são escritos como JSON com seu status, e qualquer outro erro vira um 500 genérico para que detalhes internos nunca vazem:

```json
{ "message": "user not found" }
{ "message": "validation failed", "details": [{ "field": "email", "tag": "email", "message": "email must be a valid email address" }] }
{ "message": "internal server error" }
```

## Registrando erros inesperados

A customização mais comum mantém o formato e adiciona log para tudo que não é `HTTPError`. Envolva o handler atual em vez de reescrevê-lo:

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

## Mapeando erros de domínio

Mantenha a camada de serviço livre de HTTP e traduza na borda:

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

Os handlers agora podem simplesmente fazer `return err` da chamada ao repositório.

## Problem Details (RFC 9457)

Para responder em `application/problem+json`, escreva a resposta você mesmo:

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
`SetErrorHandler` é global. Chame uma vez na inicialização, antes do servidor aceitar requisições.
:::
