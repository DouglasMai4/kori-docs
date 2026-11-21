---
title: Pacote kori
description: Todas as funções, tipos e variáveis exportados de github.com/douglasmai4/kori.
tableOfContents:
  maxHeadingLevel: 3
---

```go
import "github.com/douglasmai4/kori"
```

Requer Go 1.26+ e `github.com/go-chi/chi/v5`.

## Roteamento

### Funções de método

```go
func GET(r chi.Router, pattern string, h Handler, opts ...Option)
func POST(r chi.Router, pattern string, h Handler, opts ...Option)
func PUT(r chi.Router, pattern string, h Handler, opts ...Option)
func PATCH(r chi.Router, pattern string, h Handler, opts ...Option)
func DELETE(r chi.Router, pattern string, h Handler, opts ...Option)
func HEAD(r chi.Router, pattern string, h Handler, opts ...Option)
func OPTIONS(r chi.Router, pattern string, h Handler, opts ...Option)
```

Registram `h` em `r` para o método HTTP correspondente. `r` pode ser qualquer `chi.Router`, inclusive um `*kori.Router` retornado por `Group`. Erros retornados por `h` vão para o [`ErrorHandler`](#errorhandler) atual.

```go
kori.GET(r, "/users", listUsers)
kori.GET(r, "/users/{id}", getUser, kori.Use(adminOnly))
```

### Group

```go
func Group(r chi.Router, prefix string, middlewares ...Middleware) *Router
```

Cria um sub-router montado em `prefix` com os middlewares informados. Grupos podem ser aninhados; o prefixo completo é rastreado para que options como o OpenAPI vejam o caminho inteiro.

```go
users := kori.Group(r, "/users", authMiddleware)
kori.GET(users, "/", listUsers)
kori.GET(users, "/{id}", getUser)
```

### Router

```go
type Router struct {
    chi.Router
    // prefixo não exportado
}
```

Retornado por `Group`. Embute `chi.Router`, então todo método do Chi (`Use`, `With`, `Get`, `Mount`…) está disponível.

### Use

```go
func Use(middlewares ...Middleware) Option
```

Anexa middlewares a uma única rota, em ordem, sem criar um sub-router.

```go
kori.GET(r, "/admin", adminHandler, kori.Use(authMiddleware, auditMiddleware))
```

## Handlers e options

### Handler

```go
type Handler func(w http.ResponseWriter, r *http.Request) error
```

A assinatura padrão de handler, retornando `error`. Retorne `nil` depois de escrever a resposta, ou retorne um erro e deixe o error handler escrevê-la.

### Middleware

```go
type Middleware = func(http.Handler) http.Handler
```

Alias para o formato padrão de middleware. Qualquer middleware do Chi ou `net/http` funciona sem mudanças.

### Option

```go
type Option func(*RouteInfo)
```

Configura uma rota no momento do registro. `Use` e `openapi.Spec.Route` são options; você pode escrever as suas para criar loggers ou registros de rotas.

### RouteInfo

```go
type RouteInfo struct {
    Method  string
    Pattern string
    // campos não exportados
}
```

A rota sendo registrada, como vista por uma `Option`. `Pattern` inclui o prefixo do grupo.

## Binding

Todos os binders decodificam em `dst` (ponteiro para struct) e depois validam com [go-playground/validator](https://github.com/go-playground/validator) usando tags `validate`. Erros de decodificação retornam **400**; erros de validação retornam **422** com `[]ValidationDetail` em details.

| Função | Origem | Tag da struct |
| --- | --- | --- |
| `BindJSON(r, dst)` | Body da requisição (JSON) | `json` |
| `BindQuery(r, dst)` | Query string da URL | `query` |
| `BindPath(r, dst)` | Parâmetros de URL do Chi | `path` |
| `BindHeader(r, dst)` | Headers da requisição | `header` |
| `BindForm(r, dst)` | `application/x-www-form-urlencoded` | `form` |
| `BindMultipart(r, dst)` | Valores e arquivos `multipart/form-data` | `form` |
| `Bind(r, dst)` | Path, depois query, depois headers | `path`, `query`, `header` |

### BindJSON

```go
func BindJSON(r *http.Request, dst any) error
```

Decodifica o body como JSON. Body vazio pula a decodificação e só valida. Bodies acima do limite (4 MB por padrão) retornam **413** `request body too large`; JSON malformado retorna **400** `invalid JSON body`.

### BindQuery

```go
func BindQuery(r *http.Request, dst any) error
```

Campos slice coletam chaves repetidas: `?tag=a&tag=b` preenche `[]string{"a", "b"}`.

### BindPath

```go
func BindPath(r *http.Request, dst any) error
```

Lê valores com `chi.URLParam`. Exige que a requisição tenha sido roteada pelo Chi.

### BindHeader

```go
func BindHeader(r *http.Request, dst any) error
```

Lê valores com `r.Header.Get`, então os nomes não diferenciam maiúsculas.

### BindForm

```go
func BindForm(r *http.Request, dst any) error
```

Faz parse e decodifica `r.PostForm`. Retorna **400** `cannot parse form body` quando o parse falha.

### BindMultipart

```go
func BindMultipart(r *http.Request, dst any) error
```

Decodifica valores e arquivos. Campos de arquivo devem ser `*multipart.FileHeader` ou `[]*multipart.FileHeader`. Retorna **400** `cannot parse multipart form` quando o parse falha.

### Bind

```go
func Bind(r *http.Request, dst any) error
```

Decodifica path, query e headers na mesma struct e valida uma vez. **Não** lê o body.

### Limites

```go
func SetMaxBodyBytes(n int64)       // limite do body no BindJSON, padrão 4 MB
func SetMaxMultipartMemory(n int64) // limite multipart em memória, padrão 32 MB
```

Configurações globais. Chame na inicialização.

### ValidationDetail

```go
type ValidationDetail struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Param   string `json:"param,omitempty"`
    Message string `json:"message"`
}
```

Uma regra que falhou. `Field` usa o nome da tag (`json`, `query`, `path`, `header` ou `form`), não o nome do campo Go, então corresponde ao que o cliente enviou.

## Respostas

```go
func JSON(w http.ResponseWriter, status int, v any) error
func RawJSON(w http.ResponseWriter, status int, data []byte) error
func Text(w http.ResponseWriter, status int, s string) error
func NoContent(w http.ResponseWriter) error
func Redirect(w http.ResponseWriter, r *http.Request, status int, url string) error
```

| Função | Escreve |
| --- | --- |
| `JSON` | `v` codificado como JSON com `Content-Type: application/json` |
| `RawJSON` | Bytes JSON já codificados, sem alteração |
| `Text` | Um body `text/plain` |
| `NoContent` | `204 No Content` sem body |
| `Redirect` | Redirecionamento para `url`; `status` é `301`, `302`, `303`, `307` ou `308` |

Cada uma retorna o erro de escrita, então `return kori.JSON(...)` é a última linha idiomática de um handler.

## Erros

### HTTPError

```go
type HTTPError struct {
    Status  int    `json:"-"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

func (e *HTTPError) Error() string
```

Um erro estruturado com status. Retorne-o de um handler e o error handler escreve `Status` com `{"message", "details"}` no body.

### Construtores

```go
func NewError(status int, message string, details ...any) *HTTPError

func BadRequest(msg string, details ...any) *HTTPError          // 400
func Unauthorized(msg string, details ...any) *HTTPError        // 401
func Forbidden(msg string, details ...any) *HTTPError           // 403
func NotFound(msg string, details ...any) *HTTPError            // 404
func Conflict(msg string, details ...any) *HTTPError            // 409
func UnprocessableEntity(msg string, details ...any) *HTTPError // 422
func InternalServerError(msg string, details ...any) *HTTPError // 500
```

Apenas o primeiro valor de `details` é usado.

```go
return kori.Conflict("email already in use", map[string]string{"email": in.Email})
```

### ErrorHandler

```go
type ErrorHandler func(w http.ResponseWriter, r *http.Request, err error)

func SetErrorHandler(h ErrorHandler)
func GetErrorHandler() ErrorHandler
```

Recebe todo erro retornado por um handler. O padrão escreve `*HTTPError` como JSON e transforma qualquer outro erro em `500 {"message":"internal server error"}`. `SetErrorHandler` é global e seguro para uso concorrente. Veja [Respostas de erro customizadas](/pt-br/guides/custom-errors).

## Server-Sent Events

### NewSSEWriter

```go
func NewSSEWriter(w http.ResponseWriter) (*SSEWriter, error)
```

Define os headers SSE, faz flush e retorna um writer. Retorna `ErrStreamingNotSupported` quando `w` não implementa `http.Flusher`.

### Métodos do SSEWriter

```go
func (s *SSEWriter) Send(event SSEEvent) error
func (s *SSEWriter) SendData(data string) error
func (s *SSEWriter) SendJSON(v any) error
func (s *SSEWriter) Ping() error
```

| Método | Envia |
| --- | --- |
| `Send` | Um evento completo, com flush imediato |
| `SendData` | Um evento só com data, atalho para `Send(SSEEvent{Data: data})` |
| `SendJSON` | `v` codificado como JSON em um evento só com data |
| `Ping` | Uma linha de comentário que mantém conexões ociosas vivas |

Um erro de escrita geralmente significa que o cliente desconectou; trate como fim do stream.

### SSEEvent

```go
type SSEEvent struct {
    ID    string
    Event string
    Data  string
    Retry int
}
```

Campos vazios são omitidos. `Data` com várias linhas vira várias linhas `data:`.

### ErrStreamingNotSupported

```go
var ErrStreamingNotSupported = errors.New("kori: response writer does not support streaming (does not implement http.Flusher)")
```
