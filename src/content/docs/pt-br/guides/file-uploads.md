---
title: Upload de arquivos
description: Aceite uploads multipart com BindMultipart, valide-os e armazene arquivos com segurança.
---

`BindMultipart` decodifica campos de texto e arquivos de uma requisição `multipart/form-data` em uma única struct e a valida na mesma chamada.

## Declarando a entrada

Campos de arquivo usam `*multipart.FileHeader` para um arquivo ou `[]*multipart.FileHeader` para vários. Campos de texto usam a tag `form`, como no `BindForm`:

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

## O handler

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
        return err // vira um 500 genérico
    }

    return kori.JSON(w, http.StatusOK, map[string]string{"avatar": path})
}
```

## Armazenando o arquivo

Abra o header, nunca confie no nome de arquivo do cliente e copie para um nome que você controla:

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

## Limites

O parsing multipart mantém até 32 MB em memória por padrão e grava o restante em arquivos temporários. Reduza na inicialização se o serviço lida só com arquivos pequenos:

```go
kori.SetMaxMultipartMemory(8 << 20) // 8 MB
```

Para limitar também o tamanho total da requisição, envolva o body com `http.MaxBytesReader` em um middleware na rota de upload.

:::note
`SetMaxBodyBytes` só se aplica ao `BindJSON`. Requisições multipart seguem `SetMaxMultipartMemory` e o limite de body que você mesmo definir.
:::
