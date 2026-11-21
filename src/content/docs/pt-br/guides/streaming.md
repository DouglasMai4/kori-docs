---
title: Respostas em streaming
description: Envie progresso e tokens de LLM ao navegador com Server-Sent Events.
---

`SSEWriter` transforma qualquer handler Kori em um stream de Server-Sent Events. Este guia constrói dois casos comuns: um feed de progresso de job e um stream de tokens de um modelo de linguagem.

## Feed de progresso

```go
type Progress struct {
    Step    int    `json:"step"`
    Total   int    `json:"total"`
    Message string `json:"message"`
}

func jobProgress(w http.ResponseWriter, r *http.Request) error {
    stream, err := kori.NewSSEWriter(w)
    if err != nil {
        return err // ErrStreamingNotSupported → 500
    }

    updates := jobs.Subscribe(chi.URLParam(r, "id"))
    ticker := time.NewTicker(15 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-r.Context().Done():
            return nil // cliente saiu
        case <-ticker.C:
            if err := stream.Ping(); err != nil {
                return nil
            }
        case p, ok := <-updates:
            if !ok {
                return stream.Send(kori.SSEEvent{Event: "done", Data: "{}"})
            }
            if err := stream.SendJSON(p); err != nil {
                return nil
            }
        }
    }
}

kori.GET(r, "/jobs/{id}/progress", jobProgress)
```

Três hábitos deixam streams robustos:

- **Retorne `nil` em erros de escrita.** Uma escrita que falha quase sempre significa que o cliente desconectou. É o fim do stream, não um erro da aplicação.
- **Faça ping quando ocioso.** Proxies e load balancers fecham conexões silenciosas. Uma linha de comentário a cada 15–30 segundos as mantém abertas.
- **Observe `r.Context()`.** Ele é cancelado quando o cliente sai, então o loop para mesmo sem nenhuma escrita.

## Stream de tokens

Para saída de LLM, nomeie os eventos para o cliente distinguir tokens da mensagem final:

```go
func chat(w http.ResponseWriter, r *http.Request) error {
    var in ChatInput
    if err := kori.BindJSON(r, &in); err != nil {
        return err // still a normal JSON error: nothing was streamed yet
    }

    stream, err := kori.NewSSEWriter(w)
    if err != nil {
        return err
    }

    for tok := range model.Generate(r.Context(), in.Prompt) {
        data, _ := json.Marshal(map[string]string{"text": tok})
        if err := stream.Send(kori.SSEEvent{Event: "token", Data: string(data)}); err != nil {
            return nil
        }
    }

    return stream.Send(kori.SSEEvent{Event: "end", Data: "{}"})
}
```

Faça bind e validação **antes** de chamar `NewSSEWriter`. Depois que os headers SSE são enviados, o status está comprometido e um erro não vira mais resposta JSON.

## Cliente

```js
const source = new EventSource('/jobs/42/progress');
source.onmessage = (e) => render(JSON.parse(e.data));
source.addEventListener('done', () => source.close());
```

`EventSource` só faz requisições GET. Para um stream via POST como `chat`, leia o body com `fetch` e um stream reader.

Veja [Server-Sent Events](/pt-br/core-concepts/sse) para a API completa do `SSEWriter`.
