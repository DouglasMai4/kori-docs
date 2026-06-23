---
title: Installation
---

# Installation

## Requirements

- Go 1.22 or later
- A Chi router (Kori builds on top of it)

## Install

Install Kori and Chi:

```bash
go get github.com/douglasmai4/kori
go get github.com/go-chi/chi/v5
```

## Create a project

```bash
mkdir my-api && cd my-api
go mod init my-api
go get github.com/douglasmai4/kori
go get github.com/go-chi/chi/v5
```

Create `main.go`:

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

Run it:

```bash
go run .
```

```bash
curl http://localhost:8080/health
# ok
```
