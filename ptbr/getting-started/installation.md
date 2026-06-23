---
title: Instalação
---

# Instalação

## Requisitos

- Go 1.22 ou superior
- Um router Chi (o Kori constrói sobre ele)

## Instalar

Instale o Kori e o Chi:

```bash
go get github.com/douglasmai4/kori
go get github.com/go-chi/chi/v5
```

## Criar um projeto

```bash
mkdir minha-api && cd minha-api
go mod init minha-api
go get github.com/douglasmai4/kori
go get github.com/go-chi/chi/v5
```

Crie o `main.go`:

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/douglasmai4/kori"
)

func main() {
    r := chi.NewRouter()

    kori.GET(r, "/health", func(w http.ResponseWriter, r *http.Request) error {
        return kori.Text(w, http.StatusOK, "ok")
    })

    http.ListenAndServe(":8080", r)
}
```

Execute:

```bash
go run .
```

```bash
curl http://localhost:8080/health
# ok
```
