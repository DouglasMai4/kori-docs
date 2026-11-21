---
title: File uploads
description: Accept multipart uploads with BindMultipart, validate them, and store files safely.
---

`BindMultipart` decodes text fields and files from a `multipart/form-data` request into one struct and validates it in the same call.

## Declaring the input

File fields use `*multipart.FileHeader` for a single file or `[]*multipart.FileHeader` for many. Text fields use the `form` tag like `BindForm`:

```go
type ProfileInput struct {
    DisplayName string                `form:"display_name" validate:"required,min=2,max=50"`
    Bio         string                `form:"bio" validate:"max=500"`
    Avatar      *multipart.FileHeader `form:"avatar" validate:"required"`
}

type GalleryInput struct {
    Title  string                  `form:"title" validate:"required"`
    Tags   []string                `form:"tags" validate:"required,min=1,dive,min=2"`
    Photos []*multipart.FileHeader `form:"photos" validate:"required,min=1"`
}
```

## The handler

```go
func updateProfile(w http.ResponseWriter, r *http.Request) error {
    var in ProfileInput
    if err := kori.BindMultipart(r, &in); err != nil {
        return err // 400 on malformed form, 422 on validation
    }

    if in.Avatar.Size > 2<<20 {
        return kori.UnprocessableEntity("avatar must be 2 MB or smaller")
    }

    ct := in.Avatar.Header.Get("Content-Type")
    if ct != "image/png" && ct != "image/jpeg" {
        return kori.UnprocessableEntity("avatar must be PNG or JPEG")
    }

    path, err := store(in.Avatar)
    if err != nil {
        return err // becomes a generic 500
    }

    return kori.JSON(w, http.StatusOK, map[string]string{"avatar": path})
}
```

## Storing the file

Open the header, never trust the client filename, and copy to a name you control:

```go
func store(fh *multipart.FileHeader) (string, error) {
    src, err := fh.Open()
    if err != nil {
        return "", err
    }
    defer src.Close()

    name := uuid.NewString() + filepath.Ext(fh.Filename)
    dst, err := os.Create(filepath.Join("uploads", name))
    if err != nil {
        return "", err
    }
    defer dst.Close()

    _, err = io.Copy(dst, src)
    return "/uploads/" + name, err
}
```

## Limits

Multipart parsing keeps up to 32 MB in memory by default and spills the rest to temporary files. Lower it at startup when your service handles small files only:

```go
kori.SetMaxMultipartMemory(8 << 20) // 8 MB
```

To cap the total request size as well, wrap the body with `http.MaxBytesReader` in a middleware on the upload route.

:::note
`SetMaxBodyBytes` only applies to `BindJSON`. Multipart requests are governed by `SetMaxMultipartMemory` and whatever body limit you set yourself.
:::
