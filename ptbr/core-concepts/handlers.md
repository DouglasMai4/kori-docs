---
title: Handlers
---

# Handlers

Um handler no Kori é uma função que processa uma requisição HTTP e retorna um erro.

## Handlers padrão do net/http

A biblioteca padrão define um handler como uma função que escreve no `ResponseWriter` e não retorna nada:

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

O tratamento de erros é manual. Todo caminho que falha exige escrever uma resposta e retornar antecipadamente. Esquecer qualquer um dos dois é um bug silencioso.

## Handlers Kori

O Kori define seu próprio tipo de handler:

```go
type Handler func(w http.ResponseWriter, r *http.Request) error
```

A assinatura é idêntica à de `http.HandlerFunc`, exceto pelo retorno `error`. O Kori envolve o handler internamente e intercepta qualquer erro não-nulo antes que ele chegue ao cliente.

```go
func listUsers(w http.ResponseWriter, r *http.Request) error {
    users, err := db.All()
    if err != nil {
        return kori.InternalServerError("could not fetch users")
    }
    return kori.JSON(w, http.StatusOK, users)
}
```

Handlers são registrados em qualquer `chi.Router`:

```go
kori.GET(r, "/users", listUsers)
```

## Retornando erros

Quando um handler retorna um erro, o Kori o passa para o handler de erro configurado. O comportamento padrão é:

| Valor retornado | Resposta |
|---|---|
| `nil` | Nenhuma ação — você já escreveu a resposta |
| `*kori.HTTPError` | JSON com o status code do erro |
| Qualquer outro `error` | `500 Internal Server Error` |

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

Para status codes personalizados, use `kori.NewError`:

```go
return kori.NewError(http.StatusTooManyRequests, "rate limit exceeded", map[string]int{
    "retry_after": 60,
})
```

O segundo argumento é um detalhe estruturado opcional, incluído na resposta JSON em `"details"`.

## Helpers de resposta

O Kori fornece helpers para escrever respostas. Cada um retorna o erro de escrita para que possa ser propagado:

```go
kori.JSON(w, http.StatusOK, payload)          // application/json
kori.RawJSON(w, http.StatusOK, rawBytes)      // bytes JSON pré-codificados
kori.Text(w, http.StatusOK, "hello")          // text/plain
kori.NoContent(w)                             // 204
kori.Redirect(w, r, http.StatusFound, "/new") // redirect
```

## Benefícios

**Fluxo de erros explícito.** Os erros sobem naturalmente. Não há como engolir um erro acidentalmente sem ignorar explicitamente o valor de retorno.

**Tratamento centralizado.** Uma única chamada a `SetErrorHandler` configura como todos os erros são renderizados. É possível trocar o formato inteiro — JSON, Problem Details, XML — em um único lugar:

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

**Menos boilerplate.** A lógica da rota permanece focada no caminho feliz. Retornos antecipados propagam erros sem escrever respostas inline.

**Compatível com net/http.** Handlers Chi padrão e handlers Kori coexistem no mesmo router. A migração é incremental.
