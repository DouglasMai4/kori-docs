---
title: Binding de Requisição
---

# Binding de Requisição

O binding decodifica dados da requisição em uma struct e os valida em uma única chamada. Toda função `Bind*` retorna um erro que é seguro retornar diretamente de um handler.

## Corpo JSON

`BindJSON` lê e decodifica o corpo da requisição e depois valida a struct.

```go
type CreatePostBody struct {
    Title    string `json:"title"    validate:"required,min=1,max=200"`
    Body     string `json:"body"     validate:"required"`
    Priority string `json:"priority" validate:"required,oneof=low medium high"`
    Draft    *bool  `json:"draft"`   // pointer = campo opcional
}

func createPost(w http.ResponseWriter, r *http.Request) error {
    var body CreatePostBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 para JSON inválido, 422 para erros de validação
    }
    // body.Title, body.Body, body.Priority, body.Draft
    return kori.JSON(w, http.StatusCreated, post)
}
```

```bash
curl -X POST http://localhost:8080/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Olá","body":"Mundo","priority":"high"}'
```

O tamanho máximo padrão do corpo é 4 MB. Corpos maiores são rejeitados com `413 Payload Too Large`. Sobrescreva na inicialização:

```go
kori.SetMaxBodyBytes(16 << 20) // 16 MB
```

## Query parameters

`BindQuery` decodifica parâmetros de query da URL usando tags `query`.

```go
type ListPostsQuery struct {
    Page     int      `query:"page"      validate:"omitempty,min=1"`
    PageSize int      `query:"page_size"  validate:"omitempty,min=1,max=100"`
    Search   string   `query:"q"`
    Tags     []string `query:"tags"` // ?tags=go&tags=api  ou  ?tags=go,api
}

func listPosts(w http.ResponseWriter, r *http.Request) error {
    var q ListPostsQuery
    if err := kori.BindQuery(r, &q); err != nil {
        return err
    }
    // q.Page, q.PageSize, q.Search, q.Tags
    return kori.JSON(w, http.StatusOK, posts)
}
```

```bash
curl "http://localhost:8080/posts?page=2&page_size=20&q=kori&tags=go,api"
```

## Parâmetros de path

`BindPath` decodifica parâmetros de URL do Chi usando tags `path`.

```go
type PostParams struct {
    ID string `path:"id" validate:"required,uuid4"`
}

func getPost(w http.ResponseWriter, r *http.Request) error {
    var p PostParams
    if err := kori.BindPath(r, &p); err != nil {
        return err
    }
    // p.ID
    return kori.JSON(w, http.StatusOK, post)
}
```

::: tip
Para um único parâmetro de path sem validação, `chi.URLParam(r, "id")` é mais simples.
:::

## Headers

`BindHeader` decodifica headers HTTP usando tags `header`.

```go
type AuthHeaders struct {
    Token      string `header:"X-Auth-Token"   validate:"required"`
    APIVersion string `header:"X-Api-Version"`
}

func handler(w http.ResponseWriter, r *http.Request) error {
    var h AuthHeaders
    if err := kori.BindHeader(r, &h); err != nil {
        return err
    }
    // h.Token, h.APIVersion
    return kori.JSON(w, http.StatusOK, result)
}
```

## Combinando fontes

`kori.Bind` decodifica parâmetros de path, query e header em uma única chamada. Útil quando um handler lê de múltiplas fontes:

```go
type GetPostParams struct {
    ID      string `path:"id"`
    Expand  string `query:"expand"`
    Version string `header:"X-Api-Version"`
}

func getPost(w http.ResponseWriter, r *http.Request) error {
    var p GetPostParams
    if err := kori.Bind(r, &p); err != nil {
        return err
    }
    // p.ID do path, p.Expand da query, p.Version do header
    return kori.JSON(w, http.StatusOK, post)
}
```

## Dados de formulário

`BindForm` decodifica valores de formulário `application/x-www-form-urlencoded` usando tags `form`.

```go
type ContactForm struct {
    Name      string `form:"name"      validate:"required,min=2,max=100"`
    Email     string `form:"email"     validate:"required,email"`
    Message   string `form:"message"   validate:"required,min=10,max=1000"`
    Subscribe bool   `form:"subscribe"`
}

func handleContact(w http.ResponseWriter, r *http.Request) error {
    var form ContactForm
    if err := kori.BindForm(r, &form); err != nil {
        return err
    }
    // form.Name, form.Email, form.Message, form.Subscribe
    return kori.JSON(w, http.StatusOK, map[string]string{"status": "received"})
}
```

## Formulários multipart e upload de arquivos

`BindMultipart` decodifica `multipart/form-data`. Campos não-arquivo usam tags `form`. Campos de arquivo devem ser `*multipart.FileHeader` (único) ou `[]*multipart.FileHeader` (múltiplos).

```go
type AvatarUpload struct {
    DisplayName string                `form:"display_name" validate:"required,min=2,max=50"`
    Avatar      *multipart.FileHeader `form:"avatar"       validate:"required"`
}

func uploadAvatar(w http.ResponseWriter, r *http.Request) error {
    var input AvatarUpload
    if err := kori.BindMultipart(r, &input); err != nil {
        return err
    }

    // abre o arquivo enviado
    f, err := input.Avatar.Open()
    if err != nil {
        return kori.InternalServerError("failed to open file")
    }
    defer f.Close()

    return kori.JSON(w, http.StatusOK, map[string]string{
        "filename": input.Avatar.Filename,
        "name":     input.DisplayName,
    })
}
```

Upload de múltiplos arquivos:

```go
type GalleryUpload struct {
    Title  string                   `form:"title"  validate:"required"`
    Photos []*multipart.FileHeader  `form:"photos" validate:"required,min=1"`
}

func uploadGallery(w http.ResponseWriter, r *http.Request) error {
    var input GalleryUpload
    if err := kori.BindMultipart(r, &input); err != nil {
        return err
    }
    // input.Photos é []*multipart.FileHeader
    return kori.JSON(w, http.StatusCreated, map[string]int{
        "uploaded": len(input.Photos),
    })
}
```

A memória máxima padrão para parsing multipart é 32 MB. Sobrescreva na inicialização:

```go
kori.SetMaxMultipartMemory(64 << 20) // 64 MB
```

## Tipos suportados

Todas as funções `Bind*` suportam os seguintes tipos de campo:

`string`, `int` / `int8–64`, `uint` / `uint8–64`, `float32` / `float64`, `bool`, ponteiros para qualquer um desses, e slices `[]T` (query e form apenas).
