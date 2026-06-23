---
title: Por que o Kori?
---

# Por que o Kori?

## Trabalhar com Chi é ótimo

O Chi é um dos melhores roteadores HTTP do ecossistema Go. É rápido, composável e totalmente compatível com `net/http`. Ele não tenta controlar sua aplicação — oferece roteamento e middleware e fica fora do caminho.

Se você já usa Chi, o Kori não pede que você mude a forma como pensa sobre a sua aplicação. Ele apenas adiciona as partes que o Chi deixa intencionalmente para você.

## As partes repetitivas

A maioria dos handlers Chi segue o mesmo padrão. Aqui está um handler típico sem o Kori:

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

Esse padrão se repete em todo handler que lê um body, valida entrada ou retorna um erro. A lógica está correta — mas a maior parte é infraestrutura, não lógica de negócio.

## Menos boilerplate, mesma arquitetura

O mesmo handler com o Kori:

```go
func createUser(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 ou 422, com detalhes estruturados
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }

    return kori.JSON(w, http.StatusCreated, user)
}
```

A arquitetura é idêntica. O handler ainda lê de `*http.Request`, ainda escreve em `http.ResponseWriter` e ainda roda dentro de um router Chi. A diferença é que `BindJSON` cuida da decodificação e da validação em uma única chamada, `kori.Conflict` constrói o erro correto, e retornar esse erro é suficiente — o Kori escreve a resposta.

O mesmo vale para query parameters:

```go
// Sem o Kori
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

// Com o Kori
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

## Inspirado pelo Hono

O [Hono](https://hono.dev) é um framework web para runtimes JavaScript. Sua experiência de desenvolvimento — handlers concisos, binding de requisição tipado, rotas composáveis — influenciou a forma como o Kori aborda os mesmos problemas em Go.

O Kori não é um port do Hono. Go e JavaScript são linguagens diferentes com idiomas diferentes, e uma tradução direta produziria Go estranho. Em vez disso, o Kori pega a _ideia_: que as partes entre o roteamento e a lógica de negócio devem ser pequenas, óbvias e consistentes — e a expressa usando o sistema de tipos do Go, a biblioteca padrão e o ecossistema existente.

O resultado é um toolkit que deve parecer familiar a qualquer desenvolvedor Go, ao mesmo tempo que é visivelmente menos repetitivo de escrever.
