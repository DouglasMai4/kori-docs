---
title: Request Binding
---

# Request Binding

Binding decodes request data into a struct and validates it in a single call. Every `Bind*` function returns an error that is safe to return directly from a handler.

## JSON body

`BindJSON` reads and decodes the request body, then validates the struct.

```go
type CreatePostBody struct {
    Title    string `json:"title"    validate:"required,min=1,max=200"`
    Body     string `json:"body"     validate:"required"`
    Priority string `json:"priority" validate:"required,oneof=low medium high"`
    Draft    *bool  `json:"draft"`   // pointer = optional field
}

func createPost(w http.ResponseWriter, r *http.Request) error {
    var body CreatePostBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 for invalid JSON, 422 for validation errors
    }
    // body.Title, body.Body, body.Priority, body.Draft
    return kori.JSON(w, http.StatusCreated, post)
}
```

```bash
curl -X POST http://localhost:8080/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"World","priority":"high"}'
```

## Query parameters

`BindQuery` decodes URL query parameters using `query` struct tags.

```go
type ListPostsQuery struct {
    Page     int      `query:"page"     validate:"omitempty,min=1"`
    PageSize int      `query:"page_size" validate:"omitempty,min=1,max=100"`
    Search   string   `query:"q"`
    Tags     []string `query:"tags"` // ?tags=go&tags=api  or  ?tags=go,api
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

## Path parameters

`BindPath` decodes Chi URL parameters using `path` struct tags.

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
For a single path param without validation, `chi.URLParam(r, "id")` is simpler.
:::

## Headers

`BindHeader` decodes HTTP headers using `header` struct tags.

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

## Combining sources

`kori.Bind` decodes path, query, and header parameters in a single call. Useful when a handler reads from multiple sources:

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
    // p.ID from path, p.Expand from query, p.Version from header
    return kori.JSON(w, http.StatusOK, post)
}
```

## Form data

`BindForm` decodes `application/x-www-form-urlencoded` form values using `form` struct tags.

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

## Multipart forms and file uploads

`BindMultipart` decodes `multipart/form-data`. Non-file fields use `form` tags. File fields must be `*multipart.FileHeader` (single) or `[]*multipart.FileHeader` (multiple).

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

    // open the uploaded file
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

Multiple file uploads:

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
    // input.Photos is []*multipart.FileHeader
    return kori.JSON(w, http.StatusCreated, map[string]int{
        "uploaded": len(input.Photos),
    })
}
```

The default maximum memory for multipart parsing is 32 MB. Override it at startup:

```go
kori.SetMaxMultipartMemory(64 << 20) // 64 MB
```

## Supported types

All `Bind*` functions support the following field types:

`string`, `int` / `int8–64`, `uint` / `uint8–64`, `float32` / `float64`, `bool`, pointers to any of these, and `[]T` slices (query and form only).
