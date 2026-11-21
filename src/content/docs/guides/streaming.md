---
title: Streaming responses
description: Stream progress updates and LLM tokens to the browser with Server-Sent Events.
---

`SSEWriter` turns any Kori handler into a Server-Sent Events stream. This guide builds two common cases: a job progress feed and a token stream from a language model.

## Progress feed

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
            return nil // client left
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

Three habits make streams robust:

- **Return `nil` on write errors.** A failed write almost always means the client disconnected. It is the end of the stream, not an application error.
- **Ping while idle.** Proxies and load balancers close silent connections. A comment line every 15–30 seconds keeps them open.
- **Watch `r.Context()`.** It is cancelled when the client goes away, so your loop stops even when no write happens.

## Token stream

For LLM output, name the events so the client can tell tokens from the final message:

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

Bind and validate **before** calling `NewSSEWriter`. Once the SSE headers are flushed, the status code is committed and an error can no longer become a JSON response.

## Client

```js
const source = new EventSource('/jobs/42/progress');
source.onmessage = (e) => render(JSON.parse(e.data));
source.addEventListener('done', () => source.close());
```

`EventSource` only issues GET requests. For a POST stream like `chat`, read the body with `fetch` and a stream reader.

See [Server-Sent Events](/core-concepts/sse) for the full `SSEWriter` API.
