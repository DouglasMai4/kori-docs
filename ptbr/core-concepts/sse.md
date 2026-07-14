---
title: Server-Sent Events (SSE)
---

# Server-Sent Events (SSE)

Server-Sent Events transmitem atualizações em tempo real do servidor para o navegador por uma única conexão HTTP de longa duração. Diferente de WebSockets, o SSE é unidirecional (servidor → cliente), baseado em texto e funciona sobre HTTP puro — sem upgrade de protocolo, sem dependências extras. É uma boa escolha para feeds ao vivo, notificações, atualizações de progresso e streaming de tokens de LLM.

O suporte a SSE no Kori é um único tipo pequeno, `SSEWriter`, que envolve um `http.ResponseWriter`.

## Criando um stream

`kori.NewSSEWriter` define os headers de SSE, escreve o status `200` e faz o flush da resposta inicial:

```go
kori.GET(r, "/events", func(w http.ResponseWriter, r *http.Request) error {
    stream, err := kori.NewSSEWriter(w)
    if err != nil {
        return err
    }

    return stream.SendData("hello")
})
```

Se o `http.ResponseWriter` subjacente não implementa `http.Flusher`, o streaming é impossível e `NewSSEWriter` retorna `kori.ErrStreamingNotSupported`. Ao retorná-lo, o [tratador de erros](/ptbr/getting-started/error-handling) do Kori o transforma em uma resposta.

## Enviando eventos

Com um `stream` em mãos, há três formas de enviar dados.

### SendData

`SendData` envia um evento `data:` simples — o caso mais comum:

```go
stream.SendData("processing started")
```

### SendJSON

`SendJSON` serializa um valor para JSON e o envia como um evento `data:`. Ideal para payloads estruturados:

```go
stream.SendJSON(map[string]any{
    "progress": 42,
    "status":   "running",
})
```

O navegador recebe a string JSON em `event.data`; faça o parse com `JSON.parse`.

### Send

`Send` dá controle total sobre o evento através de `SSEEvent`:

```go
stream.Send(kori.SSEEvent{
    ID:    "42",
    Event: "progress",
    Data:  "processing",
    Retry: 3000,
})
```

`SendData` e `SendJSON` são atalhos para `Send` com apenas o campo `Data` preenchido.

## Campos do SSEEvent

| Campo   | Tipo     | Linha SSE | Propósito                                                                     |
| ------- | -------- | --------- | ----------------------------------------------------------------------------- |
| `ID`    | `string` | `id:`     | ID do evento; o navegador o reenvia como `Last-Event-ID` ao reconectar        |
| `Event` | `string` | `event:`  | Tipo de evento nomeado; escute com `addEventListener(nome, ...)` no cliente   |
| `Data`  | `string` | `data:`   | O payload. Strings multilinha são divididas em várias linhas `data:`          |
| `Retry` | `int`    | `retry:`  | Atraso de reconexão em milissegundos que o navegador espera após uma queda    |

Campos vazios são omitidos da saída.

## Mantendo a conexão viva

Conexões SSE de longa duração podem ser encerradas silenciosamente por proxies, load balancers ou firewalls que fecham conexões TCP ociosas. `Ping` envia uma linha de comentário SSE (ignorada pelo cliente) para manter a conexão aquecida. Chame-o periodicamente — a cada 15–30 segundos — quando nenhum evento real estiver trafegando:

```go
ticker := time.NewTicker(15 * time.Second)
defer ticker.Stop()

for {
    select {
    case <-r.Context().Done():
        return nil
    case <-ticker.C:
        stream.Ping()
    case msg := <-messages:
        stream.SendJSON(msg)
    }
}
```

## Lidando com desconexões

Todo método de envio retorna um erro. Um erro de escrita quase sempre significa que o cliente desconectou — trate-o como um fim de stream normal, não como um erro de aplicação, e pare o loop:

```go
if err := stream.Send(event); err != nil {
    return nil // cliente saiu, pare
}
```

Observe também `r.Context().Done()`, que dispara quando o cliente fecha a conexão, para liberar recursos (cancelar inscrições, fechar channels).

## Exemplo completo

Um relógio que transmite a hora atual uma vez por segundo e para de forma limpa quando o cliente sai:

```go
kori.GET(r, "/events/clock", func(w http.ResponseWriter, r *http.Request) error {
    stream, err := kori.NewSSEWriter(w)
    if err != nil {
        return err
    }

    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-r.Context().Done():
            return nil
        case <-ticker.C:
            if err := stream.SendData(time.Now().Format(time.RFC3339)); err != nil {
                return nil
            }
        }
    }
})
```

No navegador:

```js
const events = new EventSource("/events/clock");
events.onmessage = (e) => {
  console.log(e.data);
};
```
