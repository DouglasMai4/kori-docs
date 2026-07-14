---
title: Server-Sent Events (SSE)
---

# Server-Sent Events (SSE)

Server-Sent Events stream real-time updates from the server to the browser over a single long-lived HTTP connection. Unlike WebSockets, SSE is one-directional (server → client), text-based, and works over plain HTTP — no protocol upgrade, no extra dependencies. It's a good fit for live feeds, notifications, progress updates, and streaming LLM tokens.

Kori's SSE support is one small type, `SSEWriter`, that wraps an `http.ResponseWriter`.

## Creating a stream

`kori.NewSSEWriter` sets the SSE headers, writes the `200` status, and flushes the initial response:

```go
kori.GET(r, "/events", func(w http.ResponseWriter, r *http.Request) error {
    stream, err := kori.NewSSEWriter(w)
    if err != nil {
        return err
    }

    return stream.SendData("hello")
})
```

If the underlying `http.ResponseWriter` does not implement `http.Flusher`, streaming is impossible and `NewSSEWriter` returns `kori.ErrStreamingNotSupported`. Returning it lets Kori's [error handler](/getting-started/error-handling) turn it into a response.

## Sending events

Once you have a `stream`, there are three ways to send data.

### SendData

`SendData` sends a plain `data:` event — the most common case:

```go
stream.SendData("processing started")
```

### SendJSON

`SendJSON` marshals a value to JSON and sends it as a `data:` event. Ideal for structured payloads:

```go
stream.SendJSON(map[string]any{
    "progress": 42,
    "status":   "running",
})
```

The browser receives the JSON string in `event.data`; parse it with `JSON.parse`.

### Send

`Send` gives full control over the event through `SSEEvent`:

```go
stream.Send(kori.SSEEvent{
    ID:    "42",
    Event: "progress",
    Data:  "processing",
    Retry: 3000,
})
```

`SendData` and `SendJSON` are shorthands for `Send` with only the `Data` field set.

## SSEEvent fields

| Field   | Type     | SSE line  | Purpose                                                                    |
| ------- | -------- | --------- | -------------------------------------------------------------------------- |
| `ID`    | `string` | `id:`     | Event ID; the browser sends it back as `Last-Event-ID` on reconnect        |
| `Event` | `string` | `event:`  | Named event type; listen with `addEventListener(name, ...)` on the client  |
| `Data`  | `string` | `data:`   | The payload. Multi-line strings are split into multiple `data:` lines      |
| `Retry` | `int`    | `retry:`  | Reconnection delay in milliseconds the browser waits after a drop          |

Empty fields are omitted from the output.

## Keeping the connection alive

Long-lived SSE connections can be silently dropped by proxies, load balancers, or firewalls that close idle TCP connections. `Ping` sends an SSE comment line (ignored by the client) to keep the connection warm. Call it periodically — every 15–30 seconds — when no real events are flowing:

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

## Handling disconnects

Every send method returns an error. A write error almost always means the client has disconnected — treat it as a normal end of stream, not an application error, and stop the loop:

```go
if err := stream.Send(event); err != nil {
    return nil // client gone, stop
}
```

Also watch `r.Context().Done()`, which fires when the client closes the connection, so you can release resources (unsubscribe, close channels).

## Full example

A clock that streams the current time once per second and stops cleanly when the client leaves:

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

On the browser:

```js
const events = new EventSource("/events/clock");
events.onmessage = (e) => {
  console.log(e.data);
};
```
